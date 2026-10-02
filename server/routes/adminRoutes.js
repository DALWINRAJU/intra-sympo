const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const validateInput = require('../middleware/validateInput');
const protect = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const { ADMIN_ROLES, COMPETITION_STATUS } = require('../utils/constants');

const router = express.Router();

router.use(protect);

// Routes for both Admin and Super Admin
router.use(requireRole(ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN));

router.get('/participants', adminController.getParticipants);
router.get('/participants/:id', adminController.getParticipantDetail);
router.get('/sessions/stats', adminController.getStats);

router.get('/questions', adminController.getQuestions);
router.post('/questions', adminController.addQuestion);
router.put('/questions/:id', adminController.updateQuestion);
router.patch('/questions/:id/toggle', adminController.toggleQuestion);

router.get('/config', adminController.getConfig);

// Routes ONLY for Super Admin
router.use(requireRole(ADMIN_ROLES.SUPER_ADMIN));

router.put('/config', adminController.updateConfig);

router.post('/competition/start', 
  (req, res, next) => { req.body.status = COMPETITION_STATUS.ACTIVE; next(); },
  adminController.changeCompetitionStatus
);

router.post('/competition/pause', 
  (req, res, next) => { req.body.status = COMPETITION_STATUS.PAUSED; next(); },
  adminController.changeCompetitionStatus
);

router.post('/competition/end', 
  (req, res, next) => { req.body.status = COMPETITION_STATUS.ENDED; next(); },
  adminController.changeCompetitionStatus
);

module.exports = router;
