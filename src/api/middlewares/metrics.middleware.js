const { httpRequestCounter, httpRequestDurationMicroseconds } = require('../../core/utils/metrics');

const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const route = req.route ? req.route.path : req.path;
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode,
    };

    httpRequestCounter.inc(labels);
    httpRequestDurationMicroseconds.observe(labels, durationInSeconds);
  });

  next();
};

module.exports = metricsMiddleware;
