import crypto from 'crypto';
import Logger from '../../core/utils/logger.js';

const loggingMiddleware = (req, res, next) => {
  const start = process.hrtime();
  const requestId = crypto.randomBytes(4).toString('hex');
  const { method, url } = req;

  Logger.verbose('Router', `[${requestId}] ${method} ${url}`);

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    const { statusCode } = res;

    Logger.verbose('Router', `[${requestId}] ${method} ${url} [${statusCode}] (${timeInMs}ms)`);
  });

  next();
};

export default loggingMiddleware;
