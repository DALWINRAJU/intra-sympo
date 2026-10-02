const QuizSession = require('../models/QuizSession');
const CompetitionConfig = require('../models/CompetitionConfig');
const Question = require('../models/Question');
const AppError = require('../utils/AppError');
const { SESSION_STATUS, COMPETITION_STATUS, QUESTION_TYPES } = require('../utils/constants');

exports.getCurrentSession = async (participantId) => {
  const session = await QuizSession.findOne({ participant: participantId });
  return session; 
};

exports.startSession = async (participantId) => {
  // 1. Get competition config
  let config = await CompetitionConfig.findOne();
  if (!config) {
    throw new AppError('Competition configuration not found. Please contact admin.', 500);
  }

  if (config.competitionStatus !== COMPETITION_STATUS.ACTIVE) {
    throw new AppError('Competition is not currently active.', 403);
  }

  // 2. Check if session already exists
  const existingSession = await QuizSession.findOne({ participant: participantId });
  if (existingSession) {
    throw new AppError('You have already started the competition.', 409);
  }

  // 3. Randomly select questions based on config
  const [level1Questions, level2Questions, level3Questions] = await Promise.all([
    Question.aggregate([
      { $match: { level: 1, type: QUESTION_TYPES.MCQ, isActive: true } },
      { $sample: { size: config.level1QuestionCount } },
      { $project: { _id: 1 } }
    ]),
    Question.aggregate([
      { $match: { level: 2, type: QUESTION_TYPES.EXIT_ROOM, isActive: true } },
      { $sample: { size: config.level2StepCount } },
      { $project: { _id: 1 } }
    ]),
    Question.aggregate([
      { $match: { level: 3, type: QUESTION_TYPES.GUESS_OUTPUT, isActive: true } },
      { $sample: { size: config.level3QuestionCount } },
      { $project: { _id: 1 } }
    ])
  ]);

  // 4. Create new session with config snapshot
  const session = await QuizSession.create({
    participant: participantId,
    status: SESSION_STATUS.ACTIVE_LEVEL_1,
    startTime: new Date(),
    lives: config.level2Lives,
    level1Questions: level1Questions.map(q => q._id),
    level2Questions: level2Questions.map(q => q._id),
    level3Questions: level3Questions.map(q => q._id),
    sessionConfig: config.toObject() 
  });

  return session;
};
