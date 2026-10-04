const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizSession', required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  level: { type: Number, required: true },
  submittedAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  pointsAwarded: { type: Number, required: true, default: 0 },
  submittedAt: { type: Date, default: Date.now }
});

answerSchema.index({ session: 1, question: 1 });
answerSchema.index({ session: 1, level: 1 });

module.exports = mongoose.model('Answer', answerSchema);
