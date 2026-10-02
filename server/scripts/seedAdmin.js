const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');
const environment = require('../config/environment');
const { ADMIN_ROLES } = require('../utils/constants');
const logger = require('../utils/logger');

const seedAdmin = async () => {
  try {
    environment.validate();
    
    if (!environment.adminUsername || !environment.adminPassword) {
      throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env');
    }

    await connectDB();

    const existingAdmin = await Admin.findOne({ username: environment.adminUsername });
    
    if (existingAdmin) {
      logger.info(`Admin user '${environment.adminUsername}' already exists. Skipping.`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(environment.adminPassword, 12);
    
    await Admin.create({
      username: environment.adminUsername,
      passwordHash,
      role: ADMIN_ROLES.SUPER_ADMIN,
      isActive: true
    });

    logger.info(`Successfully created super admin: ${environment.adminUsername}`);
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
