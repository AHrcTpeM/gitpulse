import Logger from '../../core/utils/logger.js';

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: 'Route not found',
  });
};

export const globalErrorHandler = (err, req, res, next) => {
  Logger.error('ErrorHandler', err.stack || err.message);

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: err.message || 'Internal Server Error',
    errors: err.errors || undefined,
    stack: process.env.NODE_ENV === 'dev' ? err.stack : undefined,
  });
};
