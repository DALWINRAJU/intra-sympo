const QuizSession = require('../models/QuizSession');
const AppError = require('../utils/AppError');
const { SESSION_STATUS } = require('../utils/constants');

exports.getMyResult = async (participantId) => {
  const session = await QuizSession.findOne({ participant: participantId }).populate('participant', 'fullName participantId collegeName department');
  
  if (!session) {
    throw new AppError('No active session found', 404);
  }

  if (session.status !== SESSION_STATUS.COMPLETED && session.status !== SESSION_STATUS.ELIMINATED) {
    throw new AppError('Competition still in progress. Complete all levels to view results.', 403);
  }

  // Calculate dynamic rank via aggregation logic
  const higherRankCount = await QuizSession.countDocuments({
    status: { $in: [SESSION_STATUS.COMPLETED, SESSION_STATUS.ELIMINATED] },
    $or: [
      { totalScore: { $gt: session.totalScore } },
      { totalScore: session.totalScore, timeTakenMs: { $lt: session.timeTakenMs } }
    ]
  });

  return {
    fullName: session.participant?.fullName || 'Participant',
    participantId: session.participant?.participantId || '',
    collegeName: session.participant?.collegeName || '',
    department: session.participant?.department || '',
    totalScore: session.totalScore,
    level1Score: session.level1Score,
    level2Score: session.level2Score,
    level3Score: session.level3Score,
    timeTakenMs: session.timeTakenMs || 0,
    status: session.status,
    rank: higherRankCount + 1
  };
};

exports.getLeaderboard = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    QuizSession.find({ status: { $in: [SESSION_STATUS.COMPLETED, SESSION_STATUS.ELIMINATED] } })
      .sort({ totalScore: -1, timeTakenMs: 1 })
      .skip(skip)
      .limit(limit)
      .populate('participant', 'fullName collegeName'),
    QuizSession.countDocuments({ status: { $in: [SESSION_STATUS.COMPLETED, SESSION_STATUS.ELIMINATED] } })
  ]);

  const leaderboard = sessions.map((session, index) => ({
    rank: skip + index + 1,
    fullName: session.participant?.fullName || 'Unknown',
    collegeName: session.participant?.collegeName || 'Unknown',
    totalScore: session.totalScore,
    timeTakenMs: session.timeTakenMs,
    status: session.status
  }));

  return {
    leaderboard,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    }
  };
};
