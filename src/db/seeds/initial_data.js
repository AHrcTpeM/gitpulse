/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('subscriptions').del();
  await knex('repositories').del();
  await knex('subscribers').del();

  const [subscriber] = await knex('subscribers')
    .insert({
      email: 'test@example.com',
      confirmed: true,
      confirmation_token: 'seed-conf-123',
      unsubscribe_token: 'seed-unsub-123',
    })
    .returning('id');

  const [repository] = await knex('repositories')
    .insert({
      owner: 'golang',
      repo: 'go',
      last_seen_tag: 'go1.22.0',
    })
    .returning('id');

  await knex('subscriptions').insert({
    subscriber_id: subscriber.id,
    repository_id: repository.id,
  });
};
