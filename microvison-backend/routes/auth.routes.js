const express = require('express');
const router = express.Router();
const {
  login,
  registerSC,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require('../controllers/auth.controller');

// All auth routes are public
router.post('/login', login);
router.post('/register', registerSC);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
