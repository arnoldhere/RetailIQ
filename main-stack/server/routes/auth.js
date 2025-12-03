const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

// Signup route
router.post(
  '/signup',
  [
    body('firstname').isLength({ min: 2 }).withMessage('Firstname required'),
    body('lastname').isLength({ min: 1 }).withMessage('Lastname required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone'),
  ],
  AuthController.signup,
);

// Login route (accepts email or phone)
router.post(
  '/login',
  [
    body('identifier')
      .notEmpty()
      .withMessage('Email or phone is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  AuthController.login,
);

// Protected - get current user
router.get('/me', authMiddleware, AuthController.me);

// Logout
router.post('/logout', AuthController.logout);

// Forgot password: Step 1 - Request OTP
router.post(
  '/forgot-password',
  [
    body('identifier').notEmpty().withMessage('Email or phone is required'),
    body('channel').isIn(['email', 'sms']).withMessage('Channel must be email or sms'),
  ],
  AuthController.forgotPassword,
);

// Forgot password: Step 2 - Verify OTP
router.post(
  '/verify-otp',
  [
    body('identifier').notEmpty().withMessage('Email or phone is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  AuthController.verifyOTP,
);

// Forgot password: Step 3 - Reset Password
router.post(
  '/reset-password',
  [
    body('resetToken').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  AuthController.resetPassword,
);

module.exports = router;
