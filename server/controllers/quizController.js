const quizService = require('../services/quizService');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/responseFormatter');
const QuizSession = require('../models/QuizSession');

exports.getQuestion = catchAsync(async (req, res) => {
  const result = await quizService.getCurrentQuestion(req.user.id);
  sendSuccess(res, 200, result, 'Question retrieved');
});

exports.submitAnswer = catchAsync(async (req, res) => {
  const { questionId, answer } = req.body;
  const result = await quizService.submitAnswer(req.user.id, questionId, answer);
  sendSuccess(res, 200, result, 'Answer submitted successfully');
});

exports.advanceLevel = catchAsync(async (req, res) => {
  const { targetLevel } = req.body;
  const session = await quizService.advanceLevel(req.user.id, targetLevel);
  sendSuccess(res, 200, { session }, `Advanced to Level ${targetLevel}`);
});

exports.reportViolation = catchAsync(async (req, res) => {
  const session = await QuizSession.findOneAndUpdate(
    { participant: req.user.id },
    { $inc: { violationCount: 1 } },
    { new: true }
  );
  sendSuccess(res, 200, { violationCount: session?.violationCount || 0 }, 'Violation recorded');
});
