const db = require('../config/db');

/**
 * Create feedback
 * POST /api/feedback
 * Body: { message: string }
 */
async function createFeedback(req, res) {
  try {
    const { message } = req.body;
    const userId = req.user?.id || null;

    // Validation
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a string',
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
      });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Message must be at least 10 characters long',
      });
    }

    if (message.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 1000 characters',
      });
    }

    // Create feedback
    // const result = await feedbackModel.createFeedback(userId, message);
    const result = await db('feedbacks').insert({
      cust_id: userId,
      message: message.trim()
    })

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: result.data,
    });
  } catch (error) {
    console.error('Error in createFeedback:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit feedback',
    });
  }
}

/**
 * Get all feedback (admin only)
 * GET /api/feedback?limit=50&offset=0
 */
async function getAllFeedback(req, res) {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view all feedback',
      });
    }

    const { limit = 50, offset = 0 } = req.query;

    // const result = await feedbackModel.getAllFeedback(
    //   parseInt(limit),
    //   parseInt(offset)
    // );

    const result = await db('feedbacks').limit(limit).offset(offset).select("*");

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in getAllFeedback:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch feedback',
    });
  }
}

/**
 * Get feedback by ID (admin only)
 * GET /api/feedback/:id
 */
async function getFeedbackById(req, res) {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view feedback',
      });
    }

    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback ID',
      });
    }

    // const result = await feedbackModel.getFeedbackById(parseInt(id));
    const result = await db('feedbacks').where({ id: parseInt(id) }).first();

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in getFeedbackById:', error);
    return res.status(error.message === 'Feedback not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to fetch feedback',
    });
  }
}

/**
 * Get user's feedback
 * GET /api/feedback/user/my-feedback
 */
async function getUserFeedback(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { limit = 20, offset = 0 } = req.query;

    // const result = await feedbackModel.getUserFeedback(
    //   userId,
    //   parseInt(limit),
    //   parseInt(offset)
    // );
    const result = await db('feedbacks').where({ cust_id: userId }).limit(limit).offset(offset).select("*");

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in getUserFeedback:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch feedback',
    });
  }
}

/**
 * Delete feedback (admin only)
 * DELETE /api/feedback/:id
 */
async function deleteFeedback(req, res) {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete feedback',
      });
    }

    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback ID',
      });
    }

    // const result = await feedbackModel.deleteFeedback(parseInt(id));
    const result = await db('feedbacks').where({ id: parseInt(id) }).delete()

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error in deleteFeedback:', error);
    return res
      .status(error.message === 'Feedback not found' ? 404 : 500)
      .json({
        success: false,
        message: error.message || 'Failed to delete feedback',
      });
  }
}

module.exports = {
  createFeedback,
  getAllFeedback,
  getFeedbackById,
  getUserFeedback,
  deleteFeedback,
};
