const Redis = require('ioredis');

const CACHE_TTL_SECONDS = 10 * 60;

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: () => null,
});

redis.on('connect', () => console.log('[Redis] Connected'));
redis.on('error', (err) => console.warn('[Redis] Unavailable, cache disabled:', err.message));

/**
 * @param {string} key
 * @returns {Promise<string|null>}
 */
async function getCache(key) {
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {string} value
 */
async function setCache(key, value) {
  try {
    await redis.set(key, value, 'EX', CACHE_TTL_SECONDS);
  } catch {
    return null;
  }
}

module.exports = { redis, getCache, setCache, CACHE_TTL_SECONDS };
