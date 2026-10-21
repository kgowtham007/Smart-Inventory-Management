const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

/**
 * Authentication middleware
 * Verifies Bearer JWT from Authorization header, attaches decoded user to req.user
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'No token provided');
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 401, 'No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token expired');
    }
    return sendError(res, 401, 'Invalid token');
  }
};

module.exports = authMiddleware;
