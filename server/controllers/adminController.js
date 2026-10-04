const adminService = require('../services/adminService');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/responseFormatter');

exports.getParticipants = catchAsync(async (req, res) => {
  const result = await adminService.getParticipants(req.query);
  sendSuccess(res, 200, result, 'Participants retrieved successfully');
});

exports.getParticipantDetail = catchAsync(async (req, res) => {
  const result = await adminService.getParticipantDetail(req.params.id);
  sendSuccess(res, 200, result, 'Participant detail retrieved successfully');
});

exports.deleteParticipant = catchAsync(async (req, res) => {
  const result = await adminService.deleteParticipant(req.params.id);
  sendSuccess(res, 200, result, 'Participant and records deleted successfully');
});

exports.getStats = catchAsync(async (req, res) => {
  const result = await adminService.getStats();
  sendSuccess(res, 200, result, 'Stats retrieved successfully');
});

exports.getQuestions = catchAsync(async (req, res) => {
  const result = await adminService.getQuestions(req.query);
  sendSuccess(res, 200, result, 'Questions retrieved successfully');
});

exports.addQuestion = catchAsync(async (req, res) => {
  const result = await adminService.addQuestion(req.body);
  sendSuccess(res, 201, { question: result }, 'Question added successfully');
});

exports.updateQuestion = catchAsync(async (req, res) => {
  const result = await adminService.updateQuestion(req.params.id, req.body);
  sendSuccess(res, 200, { question: result }, 'Question updated successfully');
});

exports.toggleQuestion = catchAsync(async (req, res) => {
  const result = await adminService.toggleQuestion(req.params.id);
  sendSuccess(res, 200, { question: result }, 'Question status toggled successfully');
});

exports.getConfig = catchAsync(async (req, res) => {
  const result = await adminService.getConfig();
  sendSuccess(res, 200, { config: result }, 'Config retrieved successfully');
});

exports.updateConfig = catchAsync(async (req, res) => {
  const result = await adminService.updateConfig(req.body);
  sendSuccess(res, 200, { config: result }, 'Config updated successfully');
});

exports.changeCompetitionStatus = catchAsync(async (req, res) => {
  const result = await adminService.changeCompetitionStatus(req.body.status);
  sendSuccess(res, 200, { config: result }, `Competition status changed to ${req.body.status}`);
});
