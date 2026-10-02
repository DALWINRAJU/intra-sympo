const mongoose = require('mongoose');
const connectDB = require('../config/db');
const CompetitionConfig = require('../models/CompetitionConfig');
const environment = require('../config/environment');
const { DEFAULT_CONFIG } = require('../utils/constants');
const logger = require('../utils/logger');

const seedConfig = async () => {
  try {
    environment.validate();
    await connectDB();

    const configCount = await CompetitionConfig.countDocuments();
    if (configCount > 0) {
      logger.info('Competition config already exists. Skipping seeding.');
      process.exit(0);
    }

    await CompetitionConfig.create(DEFAULT_CONFIG);
    
    logger.info('Successfully created default CompetitionConfig');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding competition config:', error);
    process.exit(1);
  }
};

seedConfig();
