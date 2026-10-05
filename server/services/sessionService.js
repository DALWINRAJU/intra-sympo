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
  // Level 2: 1 question from Subcategory A (Level2a), 1 from B (Level2b), 1 from C (Level2c)
  const [l2A, l2B, l2C, l1Easy, l1Medium, l1Hard, l3IfElse, l3For, l3While] = await Promise.all([
    Question.aggregate([
      { $match: { level: 2, type: QUESTION_TYPES.EXIT_ROOM, subcategory: 'A', isActive: true } },
      { $sample: { size: 1 } }, { $project: { _id: 1 } }
    ]),
    Question.aggregate([
      { $match: { level: 2, type: QUESTION_TYPES.EXIT_ROOM, subcategory: 'B', isActive: true } },
      { $sample: { size: 1 } }, { $project: { _id: 1 } }
    ]),
    Question.aggregate([
      { $match: { level: 2, type: QUESTION_TYPES.EXIT_ROOM, subcategory: 'C', isActive: true } },
      { $sample: { size: 1 } }, { $project: { _id: 1 } }
    ]),
    Question.aggregate([
      { $match: { level: 1, type: QUESTION_TYPES.MCQ, difficulty: 'easy', isActive: true } },
      { $sample: { size: 5 } }, { $project: { _id: 1 } }
    ]),
    Question.aggregate([
      { $match: { level: 1, type: QUESTION_TYPES.MCQ, difficulty: 'medium', isActive: true } },
      { $sample: { size: 3 } }, { $project: { _id: 1 } }
    ]),
    Question.aggregate([
      { $match: { level: 1, type: QUESTION_TYPES.MCQ, difficulty: 'hard', isActive: true } },
      { $sample: { size: 2 } }, { $project: { _id: 1 } }
    ]),
    Question.aggregate([
      { $match: { level: 3, type: QUESTION_TYPES.GUESS_OUTPUT, category: { $regex: /^if-else/i }, isActive: true } },
      { $sample: { size: 1 } }, { $project: { _id: 1 } }
    ]),
    Question.aggregate([
      { $match: { level: 3, type: QUESTION_TYPES.GUESS_OUTPUT, category: { $regex: /^for loop/i }, isActive: true } },
      { $sample: { size: 1 } }, { $project: { _id: 1 } }
    ]),
    Question.aggregate([
      { $match: { level: 3, type: QUESTION_TYPES.GUESS_OUTPUT, category: { $regex: /^while loop/i }, isActive: true } },
      { $sample: { size: 1 } }, { $project: { _id: 1 } }
    ])
  ]);

  // Shuffle Level 1 questions so they aren't always grouped by difficulty
  const level1Questions = [...l1Easy, ...l1Medium, ...l1Hard].sort(() => 0.5 - Math.random());

  const level2Questions = [
    ...(l2A.length > 0 ? [l2A[0]._id] : []),
    ...(l2B.length > 0 ? [l2B[0]._id] : []),
    ...(l2C.length > 0 ? [l2C[0]._id] : [])
  ];

  const level3Questions = [];
  if (l3IfElse.length > 0) level3Questions.push(l3IfElse[0]._id);
  if (l3For.length > 0) level3Questions.push(l3For[0]._id);
  if (l3While.length > 0) level3Questions.push(l3While[0]._id);

  const targetL3Count = config.level3QuestionCount || 3;
  if (level3Questions.length < targetL3Count) {
    const additionalL3 = await Question.aggregate([
      { $match: { level: 3, type: QUESTION_TYPES.GUESS_OUTPUT, isActive: true, _id: { $nin: level3Questions } } },
      { $sample: { size: targetL3Count - level3Questions.length } }, { $project: { _id: 1 } }
    ]);
    level3Questions.push(...additionalL3.map(q => q._id));
  }

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
