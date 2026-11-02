const express = require('express');
const router = express.Router();
const reporterController = require('../controllers/telegramReporterController');
const { ensureAuthenticated } = require('../middlewares/authMiddleware');
const { ensureRole } = require('../middlewares/roleMiddleware');

router.use(ensureAuthenticated, ensureRole('super_admin'));

router.get('/', reporterController.index);
router.post('/:id/approve', reporterController.approve);
router.post('/:id/reject', reporterController.reject);

module.exports = router;

