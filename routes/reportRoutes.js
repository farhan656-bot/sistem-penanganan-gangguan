const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { ensureAuthenticated } = require('../middlewares/authMiddleware');
const { ensureRole } = require('../middlewares/roleMiddleware');
const { uploadCompletionEvidence } = require('../middlewares/uploadMiddleware');

router.get(
  '/',
  ensureAuthenticated,
  ensureRole('eksekutor', 'koordinator', 'supervisor', 'super_admin'),
  reportController.listReports
);

router.get(
  '/check-new',
  ensureAuthenticated,
  ensureRole('eksekutor', 'koordinator', 'supervisor', 'super_admin'),
  reportController.checkNewReports
);

router.get(
  '/queue-fragment',
  ensureAuthenticated,
  ensureRole('eksekutor', 'koordinator', 'supervisor', 'super_admin'),
  reportController.showReportQueueFragment
);

// Legacy manual ticket entry is intentionally disabled. Keep this guard
// before '/:id' so '/reports/create' cannot be treated as a report detail.
router.get('/create', ensureAuthenticated, (req, res) => {
  req.flash('error_msg', 'Input tiket manual sudah dinonaktifkan.');
  return res.redirect('/reports');
});

router.get(
  '/:id/detail-json',
  ensureAuthenticated,
  ensureRole('eksekutor', 'koordinator', 'supervisor', 'super_admin'),
  reportController.showReportDetailJson
);

router.get(
  '/:id',
  ensureAuthenticated,
  ensureRole('eksekutor', 'koordinator', 'supervisor', 'super_admin'),
  reportController.showReportDetail
);

router.post(
  '/:id/take',
  ensureAuthenticated,
  ensureRole('eksekutor', 'koordinator'),
  reportController.takeReport
);

router.post(
  '/:id/in-progress',
  ensureAuthenticated,
  ensureRole('eksekutor', 'koordinator'),
  reportController.markReportInProgress
);

router.post(
  '/:id/complete',
  ensureAuthenticated,
  ensureRole('eksekutor', 'koordinator'),
  uploadCompletionEvidence,
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
