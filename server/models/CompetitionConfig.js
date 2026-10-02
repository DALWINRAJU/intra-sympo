const mongoose = require('mongoose');
const { COMPETITION_STATUS } = require('../utils/constants');

const competitionConfigSchema = new mongoose.Schema({
  level1QuestionCount: { type: Number, default: 20 },
  level1PointsPerQuestion: { type: Number, default: 5 },
  level2StepCount: { type: Number, default: 3 },
  level2PointsPerStep: { type: Number, default: 10 },
  level2Lives: { type: Number, default: 3 },
  level3QuestionCount: { type: Number, default: 5 },
  level3PointsPerQuestion: { type: Number, default: 10 },
  competitionStatus: { type: String, enum: Object.values(COMPETITION_STATUS), default: COMPETITION_STATUS.NOT_STARTED },
  competitionStartTime: { type: Date },
  competitionEndTime: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('CompetitionConfig', competitionConfigSchema);
