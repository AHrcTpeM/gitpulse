const db = require('../../db/db');
const githubClient = require('../clients/github.client');

class SubscriptionService {
  async subscribe(email, repo) {
    if (!repo || !repo.includes('/')) {
      const error = new Error('Invalid repo format. Use owner/repo');
      error.status = 400;
      throw error;
    }
    const [owner, repoName] = repo.split('/');

    // 1. Пошук або створення репозиторію
    let repository = await db('repositories').where({ owner, repo: repoName }).first();
    
    if (!repository) {
      // ПЕРЕВІРКА: чи існує репо на GitHub
      const exists = await githubClient.repositoryExists(owner, repoName);
      if (!exists) {
        const error = new Error(`Repository ${owner}/${repoName} not found on GitHub`);
        error.status = 404;
        throw error;
      }

      // Отримуємо початковий тег
      const initialTag = await githubClient.getLatestTag(owner, repoName);

      [repository] = await db('repositories').insert({ 
        owner, 
        repo: repoName,
        last_seen_tag: initialTag 
      }).returning('*');
    }

    // 2. Знайти або створити підписника
    let subscriber = await db('subscribers').where({ email }).first();
    if (!subscriber) {
      [subscriber] = await db('subscribers').insert({
        email,
        confirmation_token: Buffer.from(`${email}-${Date.now()}`).toString('base64'),
        unsubscribe_token: Buffer.from(`unsub-${email}-${Date.now()}`).toString('base64')
      }).returning('*');
    }

    // 3. Створити підписку
    const existingSub = await db('subscriptions')
      .where({ subscriber_id: subscriber.id, repository_id: repository.id })
      .first();

    if (existingSub) {
      const error = new Error('Email already subscribed to this repository');
      error.status = 409;
      throw error;
    }

    await db('subscriptions').insert({
      subscriber_id: subscriber.id,
      repository_id: repository.id
    });

    return { message: 'Subscription successful' };
  }

  async confirm(token) {
    const subscriber = await db('subscribers').where({ confirmation_token: token }).first();
    if (!subscriber) {
      const error = new Error('Token not found');
      error.status = 404;
      throw error;
    }

    await db('subscribers').where({ id: subscriber.id }).update({ confirmed: true });
    return { message: 'Subscription confirmed successfully' };
  }

  async unsubscribe(token) {
    const subscriber = await db('subscribers').where({ unsubscribe_token: token }).first();
    if (!subscriber) {
      const error = new Error('Token not found');
      error.status = 404;
      throw error;
    }

    await db('subscriptions').where({ subscriber_id: subscriber.id }).del();
    return { message: 'Unsubscribed successfully' };
  }

  async getAllByEmail(email) {
    return db('subscriptions')
      .join('subscribers', 'subscriptions.subscriber_id', 'subscribers.id')
      .join('repositories', 'subscriptions.repository_id', 'repositories.id')
      .where('subscribers.email', email)
      .select(
        'subscribers.email',
        db.raw("concat(repositories.owner, '/', repositories.repo) as repo"),
        'subscribers.confirmed',
        'repositories.last_seen_tag'
      );
  }
}

module.exports = new SubscriptionService();
