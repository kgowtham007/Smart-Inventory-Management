const notFoundMiddleware = (req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: 'Route not found',
  });
};

module.exports = notFoundMiddleware;
