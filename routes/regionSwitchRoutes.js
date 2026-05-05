const express = require('express');
const router = express.Router();
const regionSwitchController = require('../controllers/regionSwitchController');
const { ensureAuthenticated } = require('../middlewares/authMiddleware');
const { ensureRole } = require('../middlewares/roleMiddleware');

// Executor routes
router.get(
  '/my',
  ensureAuthenticated,
  ensureRole('eksekutor'),
  regionSwitchController.listMyRequests
);

router.get(
  '/create',
  ensureAuthenticated,
  ensureRole('eksekutor'),
  regionSwitchController.showCreateRequestForm
);

router.post(
  '/',
  ensureAuthenticated,
  ensureRole('eksekutor'),
  regionSwitchController.submitRequest
);

// Coordinator routes
router.get(
  '/pending',
  ensureAuthenticated,
  ensureRole('koordinator'),
  regionSwitchController.listPendingApprovals
);

router.post(
  '/:id/approve',
  ensureAuthenticated,
  ensureRole('koordinator'),
  regionSwitchController.approveRequest
);

router.post(
  '/:id/reject',
  ensureAuthenticated,
  ensureRole('koordinator'),
  regionSwitchController.rejectRequest
);

module.exports = router;
