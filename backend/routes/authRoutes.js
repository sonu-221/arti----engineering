const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', authController.signup);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/check-email
router.post('/check-email', authController.checkEmail);

// POST /api/auth/reset-password
router.post('/reset-password', authController.resetPassword);

module.exports = router;
