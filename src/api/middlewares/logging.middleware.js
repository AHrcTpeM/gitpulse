const crypto = require('crypto');
const Logger = require('../../core/utils/logger');

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

module.exports = loggingMiddleware;
