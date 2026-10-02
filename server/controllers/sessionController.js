const sessionService = require('../services/sessionService');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/responseFormatter');

exports.getCurrentSession = catchAsync(async (req, res) => {
  const session = await sessionService.getCurrentSession(req.user.id);
  sendSuccess(res, 200, { session }, 'Current session retrieved');
});

exports.startSession = catchAsync(async (req, res) => {
  const session = await sessionService.startSession(req.user.id);
  sendSuccess(res, 201, { session }, 'Competition started successfully');
});
