const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { ensureAuthenticated } = require('../middlewares/authMiddleware');
const { ensureRole } = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get(
  '/',
  ensureAuthenticated,
  ensureRole('eksekutor', 'koordinator'),
  reportController.listReports
);

router.get(
  '/:id',
  ensureAuthenticated,
  ensureRole('eksekutor', 'koordinator'),
  reportController.showReportDetail
);

router.post(
  '/:id/take',
  ensureAuthenticated,
  ensureRole('eksekutor'),
  reportController.takeReport
);

router.post(
  '/:id/complete',
  ensureAuthenticated,
  ensureRole('eksekutor'),
  upload.single('proof_file'),
  reportController.completeReport
);

router.post(
  '/:id/delegate',
  ensureAuthenticated,
  ensureRole('koordinator'),
  reportController.delegateReport
);

router.post(
  '/:id/cancel-assignment',
  ensureAuthenticated,
  ensureRole('koordinator'),
  reportController.cancelAssignment
);

module.exports = router;