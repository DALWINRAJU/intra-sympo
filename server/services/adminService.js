const Participant = require('../models/Participant');
const QuizSession = require('../models/QuizSession');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const CompetitionConfig = require('../models/CompetitionConfig');
const AppError = require('../utils/AppError');
const { COMPETITION_STATUS } = require('../utils/constants');

exports.getParticipants = async ({ search, status, page = 1, limit = 50, sortBy = 'totalScore', order = 'desc' }) => {
  const skip = (page - 1) * limit;

  let participantMatch = {};
  if (search) {
    participantMatch = {
      $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { participantId: { $regex: search, $options: 'i' } },
        { collegeName: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ]
    };
  }

  let participantIds = null;
  if (search) {
    const matched = await Participant.find(participantMatch).select('_id');
    participantIds = matched.map(p => p._id);
  }

  let sessionQuery = {};
  if (status) sessionQuery.status = status;
  if (participantIds) sessionQuery.participant = { $in: participantIds };

  let sortConfig = { totalScore: -1, timeTakenMs: 1 };
  if (sortBy && sortBy !== 'totalScore') {
    sortConfig = { [sortBy]: order === 'asc' ? 1 : -1 };
  } else if (order === 'asc') {
    sortConfig = { totalScore: 1, timeTakenMs: -1 };
  }

  const [sessions, total] = await Promise.all([
    QuizSession.find(sessionQuery)
      .sort(sortConfig)
      .skip(skip)
      .limit(Number(limit))
      .populate('participant', '-participantPin'),
    QuizSession.countDocuments(sessionQuery)
  ]);

  const rankedParticipants = sessions.map((s, idx) => ({
    rank: skip + idx + 1,
    sessionId: s._id,
    participant: s.participant,
    participantId: s.participant?.participantId || 'N/A',
    fullName: s.participant?.fullName || 'Unknown',
    collegeName: s.participant?.collegeName || 'N/A',
    department: s.participant?.department || 'N/A',
    status: s.status,
    currentLevel: s.currentLevel,
    level1Score: s.level1Score || 0,
    level2Score: s.level2Score || 0,
    level3Score: s.level3Score || 0,
    totalScore: s.totalScore || 0,
    lives: s.lives,
    violationCount: s.violationCount || 0,
    startTime: s.startTime,
    endTime: s.endTime,
    timeTakenMs: s.timeTakenMs || 0,
    registeredAt: s.participant?.registeredAt || s.createdAt,
    session: s
  }));

  return {
    participants: rankedParticipants,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit) }
  };
};

exports.getParticipantDetail = async (id) => {
  let session = await QuizSession.findById(id).populate('participant', '-participantPin');
  let participant = null;

  if (!session) {
    participant = await Participant.findById(id).select('-participantPin') || await Participant.findOne({ participantId: id }).select('-participantPin');
    if (participant) {
      session = await QuizSession.findOne({ participant: participant._id }).populate('participant', '-participantPin');
    }
  } else {
    participant = session.participant;
  }

  if (!participant && !session) {
    throw new AppError('Participant/Session not found', 404);
  }

  let answers = [];
  if (session) {
    answers = await Answer.find({ session: session._id })
      .populate('question')
      .sort({ submittedAt: 1, level: 1 });
  }

  return {
    session,
    participant: participant || session?.participant,
    answers
  };
};

exports.deleteParticipant = async (id) => {
  let participant = await Participant.findById(id);
  let session = null;

  if (!participant) {
    session = await QuizSession.findById(id);
    if (session) {
      participant = await Participant.findById(session.participant);
    } else {
      participant = await Participant.findOne({ participantId: id });
    }
  }

  if (!participant && !session) {
    throw new AppError('Participant or session not found', 404);
  }

  const pId = participant ? participant._id : session?.participant;
  if (!session && pId) {
    session = await QuizSession.findOne({ participant: pId });
  }

  if (session) {
    await Answer.deleteMany({ session: session._id });
    await QuizSession.deleteOne({ _id: session._id });
  }

  if (participant) {
    await Participant.deleteOne({ _id: participant._id });
  }

  return { deleted: true, participantId: participant?.participantId || id };
};

exports.getStats = async () => {
  const [totalParticipants, active, completed, eliminated, scoreStats] = await Promise.all([
    Participant.countDocuments(),
    QuizSession.countDocuments({ status: { $regex: '^ACTIVE' } }),
    QuizSession.countDocuments({ status: 'COMPLETED' }),
    QuizSession.countDocuments({ status: 'ELIMINATED' }),
    QuizSession.aggregate([
      {
        $group: {
          _id: null,
          highestScore: { $max: '$totalScore' },
          avgScore: { $avg: '$totalScore' }
        }
      }
    ])
  ]);

  const highestScore = scoreStats.length > 0 ? (scoreStats[0].highestScore || 0) : 0;
  const avgScore = scoreStats.length > 0 ? Math.round((scoreStats[0].avgScore || 0) * 10) / 10 : 0;

  return {
    totalParticipants,
    activeSessions: active,
    completedSessions: completed,
    eliminatedSessions: eliminated,
    highestScore,
    avgScore
  };
};

exports.getQuestions = async ({ level, type, category, isActive, page = 1, limit = 20 }) => {
  const query = {};
  if (level) query.level = level;
  if (type) query.type = type;
  if (category) query.category = { $regex: category, $options: 'i' };
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const skip = (page - 1) * limit;
  const [questions, total] = await Promise.all([
    Question.find(query).skip(skip).limit(limit),
    Question.countDocuments(query)
  ]);

  return { questions, pagination: { total, page: Number(page), pages: Math.ceil(total / limit), limit: Number(limit) } };
};

exports.addQuestion = async (data) => {
  return await Question.create(data);
};

exports.updateQuestion = async (id, data) => {
  const question = await Question.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!question) throw new AppError('Question not found', 404);
  return question;
};

exports.toggleQuestion = async (id) => {
  const question = await Question.findById(id);
  if (!question) throw new AppError('Question not found', 404);
  question.isActive = !question.isActive;
  await question.save();
  return question;
};

exports.getConfig = async () => {
  return await CompetitionConfig.findOne();
};

exports.updateConfig = async (data) => {
  let config = await CompetitionConfig.findOne();
  if (!config) {
    config = await CompetitionConfig.create(data);
    return config;
  }
  
  Object.assign(config, data);
  await config.save();
  return config;
};

exports.changeCompetitionStatus = async (status) => {
  const config = await CompetitionConfig.findOne();
  if (!config) throw new AppError('Config not found', 404);
  
  config.competitionStatus = status;
  if (status === COMPETITION_STATUS.ACTIVE) config.competitionStartTime = new Date();
  if (status === COMPETITION_STATUS.ENDED) config.competitionEndTime = new Date();
  
  await config.save();
  return config;
};
