const express = require('express');
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middlewares/auth');

const router = express.Router();

// Restrict fetching user lists to authenticated administrators
router.use(protect);
router.get('/', restrictTo('ADMIN'), userController.getAll);

module.exports = router;
