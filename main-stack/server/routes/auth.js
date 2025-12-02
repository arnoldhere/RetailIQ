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

module.exports = router;
