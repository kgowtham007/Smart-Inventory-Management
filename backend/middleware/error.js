const errorMiddleware = (err, req, res, next) => {
  console.error('Unhandled error:', err.stack);

  // Handle Mongoose connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
    return res.status(503).json({
      success: false,
      data: null,
      message: 'Database unavailable',
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

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      data: null,
      message: `Duplicate value for field: ${field}`,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Invalid or expired token',
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    data: null,
    message: 'Internal server error',
  });
};

module.exports = errorMiddleware;
