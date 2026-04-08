const Logger = require('../core/utils/logger');

const notFoundHandler = (req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: 'Route not found'
  });
};

const globalErrorHandler = (err, req, res, next) => {
  Logger.error('ErrorHandler', err.stack || err.message);

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    statusCode,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'dev' ? err.stack : undefined
  });
};

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
