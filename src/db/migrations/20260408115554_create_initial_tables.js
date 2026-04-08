/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('subscribers', (table) => {
      table.increments('id').primary();
      table.string('email').unique().notNullable();
      table.boolean('confirmed').defaultTo(false);
      table.string('confirmation_token').unique().notNullable();
      table.string('unsubscribe_token').unique().notNullable();
      table.timestamps(true, true);
    })
    .createTable('repositories', (table) => {
      table.increments('id').primary();
      table.string('owner').notNullable();
      table.string('repo').notNullable();
      table.string('last_seen_tag');
      table.unique(['owner', 'repo']);
      table.timestamps(true, true);
    })
    .createTable('subscriptions', (table) => {
      table.increments('id').primary();
      table.integer('subscriber_id').unsigned().references('id').inTable('subscribers').onDelete('CASCADE');
      table.integer('repository_id').unsigned().references('id').inTable('repositories').onDelete('CASCADE');
      table.unique(['subscriber_id', 'repository_id']);
      table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('subscriptions')
    .dropTableIfExists('repositories')
    .dropTableIfExists('subscribers');
};
