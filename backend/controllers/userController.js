const { validationResult } = require('express-validator');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/users
 * Admin only: list all users
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}, 'id name email role createdAt updatedAt');
    return sendSuccess(res, 200, users, 'Users retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id
 * Admin only: update user role
 */
const updateUserRole = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, errors.array().map((e) => e.msg).join(', '));
    }

    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    user.role = role;
    await user.save();

    return sendSuccess(
      res,
      200,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      'User role updated successfully'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, updateUserRole };
