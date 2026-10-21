const { sendError } = require('../utils/response');

/**
 * Role-Based Access Control middleware factory
 * Returns a middleware that checks if req.user.role is in the allowed roles array
 * @param {string[]} roles - Array of allowed roles
 */
const rbacMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'Forbidden: insufficient permissions');
    }

    next();
  };
};

module.exports = rbacMiddleware;
