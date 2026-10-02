const Participant = require('../models/Participant');
const QuizSession = require('../models/QuizSession');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const CompetitionConfig = require('../models/CompetitionConfig');
const AppError = require('../utils/AppError');
const { COMPETITION_STATUS } = require('../utils/constants');

exports.getParticipants = async ({ search, status, page = 1, limit = 20, sortBy = 'totalScore', order = 'desc' }) => {
  const skip = (page - 1) * limit;
  let sessionQuery = {};
  if (status) sessionQuery.status = status;

  if (search) {
    const participants = await Participant.find({
      $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { participantId: { $regex: search, $options: 'i' } },
        { collegeName: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    const participantIds = participants.map(p => p._id);
    sessionQuery.participant = { $in: participantIds };
  }

  const sortConfig = { [sortBy]: order === 'asc' ? 1 : -1 };

  const [sessions, total] = await Promise.all([
    QuizSession.find(sessionQuery)
      .sort(sortConfig)
      .skip(skip)
      .limit(limit)
      .populate('participant', '-participantPin'),
    QuizSession.countDocuments(sessionQuery)
  ]);

  return {
    participants: sessions,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit), limit: Number(limit) }
  };
};

exports.getParticipantDetail = async (sessionId) => {
  const session = await QuizSession.findById(sessionId).populate('participant', '-participantPin');
  if (!session) throw new AppError('Session not found', 404);

  const answers = await Answer.find({ session: sessionId }).populate('question');
  return { session, answers };
};

exports.getStats = async () => {
  const [totalParticipants, active, completed, eliminated] = await Promise.all([
    Participant.countDocuments(),
    QuizSession.countDocuments({ status: { $regex: '^ACTIVE' } }),
    QuizSession.countDocuments({ status: 'COMPLETED' }),
    QuizSession.countDocuments({ status: 'ELIMINATED' })
  ]);
  return { totalParticipants, active, completed, eliminated };
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
