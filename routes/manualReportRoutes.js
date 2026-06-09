const express = require('express');
const router = express.Router();
const manualReportController = require('../controllers/manualReportController');
const { ensureAuthenticated } = require('../middlewares/authMiddleware');
const { ensureRole } = require('../middlewares/roleMiddleware');

router.use(ensureAuthenticated);

router.get(
  '/',
  ensureRole('eksekutor', 'koordinator', 'super_admin'),
  manualReportController.index
);

router.get(
  '/create',
  ensureRole('eksekutor', 'koordinator'),
  manualReportController.create
);

router.post(
  '/',
  ensureRole('eksekutor', 'koordinator'),
  manualReportController.store
);

router.get(
  '/:id',
  ensureRole('eksekutor', 'koordinator', 'super_admin'),
  manualReportController.show
);

module.exports = router;
