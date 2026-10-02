const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Question = require('../models/Question');
const environment = require('../config/environment');
const logger = require('../utils/logger');
const questionsData = require('../data/questions.json');

const seedQuestions = async () => {
  try {
    environment.validate();
    await connectDB();

    const count = await Question.countDocuments();
    if (count > 0) {
      logger.info(`Found ${count} existing questions. Skipping seeding to prevent duplicates.`);
      logger.info('If you want to re-seed, manually clear the questions collection first.');
      process.exit(0);
    }

    await Question.insertMany(questionsData);
    logger.info(`Successfully seeded ${questionsData.length} questions from question bank.`);
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding questions:', error);
    process.exit(1);
  }
};

seedQuestions();
