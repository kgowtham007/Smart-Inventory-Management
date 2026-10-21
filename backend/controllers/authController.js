const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Generate JWT for a user
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/**
 * POST /api/auth/register
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, errors.array().map((e) => e.msg).join(', '));
    }

    const { name, email, password } = req.body;

    // Check for duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 409, 'Email already in use');
    }

    // Hash password with 10 salt rounds
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user (role defaults to 'clerk')
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
    });

    const token = generateToken(user);

    return sendSuccess(
      res,
      201,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      'User registered successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Login with email and password
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, errors.array().map((e) => e.msg).join(', '));
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendError(res, 401, 'Invalid credentials');
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid credentials');
    }

    const token = generateToken(user);

    return sendSuccess(
      res,
      200,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      'Login successful'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
