import db from '../../src/db/db.js';

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
};
