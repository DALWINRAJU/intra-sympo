const resultService = require('../services/resultService');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/responseFormatter');

exports.getMyResult = catchAsync(async (req, res) => {
  const result = await resultService.getMyResult(req.user.id);
  sendSuccess(res, 200, { result }, 'Result retrieved successfully');
});

exports.getLeaderboard = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  
  const result = await resultService.getLeaderboard(page, limit);
  sendSuccess(res, 200, result, 'Leaderboard retrieved successfully');
});
