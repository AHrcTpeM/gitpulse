import Redis from 'ioredis';
import Logger from '../utils/logger.js';

export const CACHE_TTL_SECONDS = 10 * 60;

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: () => null,
});

redis.on('connect', () => Logger.log('Redis', 'Connected'));
redis.on('error', (err) => Logger.warn('Redis', `Unavailable, cache disabled: ${err.message}`));

/**
 * @param {string} key
 * @returns {Promise<string|null>}
 */
export async function getCache(key) {
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
export async function setCache(key, value) {
  try {
    await redis.set(key, value, 'EX', CACHE_TTL_SECONDS);
  } catch {
    return null;
  }
}
