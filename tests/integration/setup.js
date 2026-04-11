import db from '../../src/db/db.js';
import { redis } from '../../src/core/clients/redis.client.js';

export const setupDatabase = async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
};

export const clearDatabase = async () => {
  const tables = ['subscriptions', 'repositories', 'subscribers'];
  for (const table of tables) {
    try {
      await db(table).del();
    } catch {
      // Table might not exist yet
    }
  }
};

export const closeDatabase = async () => {
  await db.destroy();
  if (redis.status !== 'end') {
    await redis.quit().catch(() => redis.disconnect());
  }
};
