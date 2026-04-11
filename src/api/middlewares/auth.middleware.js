import Logger from '../../core/utils/logger.js';

const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;

  if (!apiKey || apiKey !== validApiKey) {
    Logger.warn('Auth', `Unauthorized access attempt from IP: ${req.ip}`);
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Invalid or missing API key',
    });
  }

  next();
};

export default authMiddleware;
