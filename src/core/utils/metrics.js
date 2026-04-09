const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: 'gitpulse_',
});

const httpRequestCounter = new client.Counter({
  name: 'gitpulse_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'gitpulse_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10],
});

register.registerMetric(httpRequestCounter);
register.registerMetric(httpRequestDurationMicroseconds);

module.exports = {
  register,
  httpRequestCounter,
  httpRequestDurationMicroseconds,
};
