const express = require('express');
const { body } = require('express-validator');
const quizController = require('../controllers/quizController');
const validateInput = require('../middleware/validateInput');
const protect = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const rateLimit = require('express-rate-limit');

const router = express.Router();

router.use(protect);
router.use(requireRole('participant'));

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500, // 500 answer submissions per participant
  keyGenerator: (req) => (req.user?.id ? req.user.id.toString() : req.ip),
  validate: { keyGeneratorIpFallback: false },
  message: { success: false, message: 'Too many answer submissions, please slow down' }
});

router.get('/question', quizController.getQuestion);

router.post('/submit-answer',
  submitLimiter,
  [
    body('questionId').trim().notEmpty().withMessage('Question ID is required'),
    body('answer').notEmpty().withMessage('Answer is required')
  ],
  validateInput,
  quizController.submitAnswer
);

router.post('/advance-level',
  [
    body('targetLevel').isInt({ min: 2, max: 3 }).withMessage('Target level must be 2 or 3')
  ],
  validateInput,
  quizController.advanceLevel
);

module.exports = router;
