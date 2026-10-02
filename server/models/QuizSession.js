const mongoose = require('mongoose');
const { SESSION_STATUS } = require('../utils/constants');

const quizSessionSchema = new mongoose.Schema({
  participant: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true, unique: true },
  status: { type: String, enum: Object.values(SESSION_STATUS), default: SESSION_STATUS.NOT_STARTED },
  startTime: { type: Date },
  endTime: { type: Date },
  timeTakenMs: { type: Number },
  currentLevel: { type: Number, default: 1 },
  level1Score: { type: Number, default: 0 },
  level2Score: { type: Number, default: 0 },
  level3Score: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  lives: { type: Number, default: 3 },
  level1Questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  level2Questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  level3Questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  level1CurrentIndex: { type: Number, default: 0 },
  level2CurrentIndex: { type: Number, default: 0 },
  level3CurrentIndex: { type: Number, default: 0 },
  sessionConfig: { type: Object, required: true }
}, { timestamps: true });

quizSessionSchema.index({ status: 1 });
quizSessionSchema.index({ totalScore: -1, timeTakenMs: 1 });

module.exports = mongoose.model('QuizSession', quizSessionSchema);
