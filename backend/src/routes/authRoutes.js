const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const router = express.Router();


router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/change-password', protect, authController.changePassword);


module.exports = router;
