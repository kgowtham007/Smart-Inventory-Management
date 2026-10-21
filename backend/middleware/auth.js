const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

/**
 * Verify JWT and attach decoded user to req.user
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'No token provided', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token', 401);
  }
};

/**
 * Role-based access control middleware factory
 * @param {string[]} roles - Allowed roles
 */
const rbacMiddleware = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return sendError(res, 'Forbidden: insufficient permissions', 403);
  }
  next();
};

module.exports = { authMiddleware, rbacMiddleware };
