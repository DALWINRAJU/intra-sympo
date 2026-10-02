const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/responseFormatter');

exports.register = catchAsync(async (req, res) => {
  const result = await authService.registerParticipant(req.body);
  sendSuccess(res, 201, result, 'Registration successful');
});

exports.login = catchAsync(async (req, res) => {
  const { participantId, participantPin } = req.body;
  const result = await authService.loginParticipant(participantId, participantPin);
  sendSuccess(res, 200, result, 'Login successful');
});

exports.adminLogin = catchAsync(async (req, res) => {
  const { username, password } = req.body;
  const result = await authService.loginAdmin(username, password);
  sendSuccess(res, 200, result, 'Admin login successful');
});
