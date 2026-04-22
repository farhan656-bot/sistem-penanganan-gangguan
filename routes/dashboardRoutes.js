const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { ensureAuthenticated } = require('../middlewares/authMiddleware');
const { ensureRole } = require('../middlewares/roleMiddleware');

router.get(
  '/eksekutor',
  ensureAuthenticated,
  ensureRole('eksekutor'),
  dashboardController.eksekutorDashboard
);

router.get(
  '/koordinator',
  ensureAuthenticated,
  ensureRole('koordinator'),
  dashboardController.koordinatorDashboard
);

router.get(
  '/supervisor',
  ensureAuthenticated,
  ensureRole('supervisor'),
  dashboardController.supervisorDashboard
);

module.exports = router;