const express = require('express');
const resultController = require('../controllers/resultController');
const protect = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

const router = express.Router();

// Public leaderboard route (frontend polls this periodically)
router.get('/leaderboard', resultController.getLeaderboard);

// Protected personal result route
router.use(protect);
router.use(requireRole('participant'));
router.get('/me', resultController.getMyResult);

module.exports = router;
