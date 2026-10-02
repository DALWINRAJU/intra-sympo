const express = require('express');
const sessionController = require('../controllers/sessionController');
const protect = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

const router = express.Router();

// Require participant authentication for these routes
router.use(protect);
router.use(requireRole('participant'));

router.get('/current', sessionController.getCurrentSession);
router.post('/start', sessionController.startSession);

module.exports = router;
