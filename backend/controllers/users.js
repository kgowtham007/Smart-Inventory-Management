const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/users - admin only
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}, '-passwordHash');
    return sendSuccess(res, users, 'Users retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id - admin only
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'manager', 'clerk'];

    if (!role || !validRoles.includes(role)) {
      return sendError(res, `Role must be one of: ${validRoles.join(', ')}`, 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true, select: '-passwordHash' }
    );

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, user, 'User role updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, updateUserRole };
