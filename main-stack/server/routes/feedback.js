const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authenticate = require('../middlewares/auth');

/**
 * @route   POST /api/feedback
 * @desc    Create new feedback
 * @access  Public (no auth required, but optional)
 */
router.post('/', feedbackController.createFeedback);

/**
 * @route   GET /api/feedback
 * @desc    Get all feedback (admin only)
 * @access  Private (admin only)
 */
router.get('/', authenticate, feedbackController.getAllFeedback);

/**
 * @route   GET /api/feedback/user/my-feedback
 * @desc    Get user's own feedback
 * @access  Private
 */
router.get('/user/my-feedback', authenticate, feedbackController.getUserFeedback);

/**
 * @route   GET /api/feedback/:id
 * @desc    Get feedback by ID (admin only)
 * @access  Private (admin only)
 */
router.get('/:id', authenticate, feedbackController.getFeedbackById);

/**
 * @route   DELETE /api/feedback/:id
 * @desc    Delete feedback (admin only)
 * @access  Private (admin only)
 */
router.delete('/:id', authenticate, feedbackController.deleteFeedback);

module.exports = router;
