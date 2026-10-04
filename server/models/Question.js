const mongoose = require('mongoose');
const { QUESTION_TYPES } = require('../utils/constants');

const optionSchema = new mongoose.Schema({
  label: { type: String, required: true },
  text: { type: String, required: true }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: Object.values(QUESTION_TYPES), required: true },
  level: { type: Number, required: true, min: 1, max: 3 },
  category: { type: String, required: true },
  subcategory: { type: String },           // Used for Level 2: 'A', 'B', or 'C'
  questionText: { type: String, required: true },
  codeSnippet: { type: String },
  language: { type: String },
  options: [optionSchema],
  correctAnswer: { type: String, required: true },
  points: { type: Number, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

questionSchema.index({ type: 1, level: 1, isActive: 1 });
questionSchema.index({ category: 1 });

module.exports = mongoose.model('Question', questionSchema);
