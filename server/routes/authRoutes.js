const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validateInput = require('../middleware/validateInput');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000, // Accommodates 100+ students registering and logging in from the same Wi-Fi
  message: { success: false, message: 'Too many authentication attempts, please try again later' }
});

router.post('/register',
  authLimiter,
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('collegeName').trim().notEmpty().withMessage('College name is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('participantId').trim().notEmpty().withMessage('Participant ID is required'),
    body('participantPin').trim().isLength({ min: 4 }).withMessage('PIN must be at least 4 characters')
  ],
  validateInput,
  authController.register
);

router.post('/login',
  authLimiter,
  [
    body('participantId').trim().notEmpty().withMessage('Participant ID is required'),
    body('participantPin').trim().notEmpty().withMessage('PIN is required')
  ],
  validateInput,
  authController.login
);

router.post('/admin/login',
  authLimiter,
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validateInput,
  authController.adminLogin
);

module.exports = router;
