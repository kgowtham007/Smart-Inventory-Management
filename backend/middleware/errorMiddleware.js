/**
 * Global error handling middleware
 */

/**
 * 404 Not Found middleware - catches all unmatched routes
 */
const notFoundMiddleware = (req, res, next) => {
  res.status(404).json({
    success: false,
    data: null,
    message: 'Route not found',
  });
};

/**
 * Global error middleware - catches all unhandled errors
 */
const errorMiddleware = (err, req, res, next) => {
  // Log the error stack trace to console
  console.error(err.stack);

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      data: null,
      message: `Duplicate value for field: ${field}`,
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      data: null,
      message: messages.join(', '),
    });
  }

  // Handle MongoDB connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
    return res.status(503).json({
      success: false,
      data: null,
      message: 'Database unavailable',
    });
  }

  // Default 500 error
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    data: null,
    message: err.message || 'Internal server error',
  });
};

module.exports = { notFoundMiddleware, errorMiddleware };
