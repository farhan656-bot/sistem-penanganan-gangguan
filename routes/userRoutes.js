const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated } = require('../middlewares/authMiddleware');
const { ensureRole } = require('../middlewares/roleMiddleware');

router.use(ensureAuthenticated, ensureRole('super_admin'));

router.get('/', userController.listUsers);
router.get('/create', userController.showCreateUser);
router.post('/', userController.createUser);
router.get('/:id/edit', userController.showEditUser);
router.post('/:id/update', userController.updateUser);

module.exports = router;
