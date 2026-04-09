import db from '../../db/db.js';
import githubClient from '../clients/github.client.js';
import notifierService from './notifier.service.js';
import Logger from '../utils/logger.js';

class SubscriptionService {
  async subscribe(email, repo) {
    if (!repo || !repo.includes('/')) {
      const error = new Error('Invalid repo format. Use owner/repo');
      error.status = 400;
      throw error;
    }
    const [owner, repoName] = repo.split('/');

    let repository = await db('repositories').where({ owner, repo: repoName }).first();

    if (!repository) {
      const exists = await githubClient.repositoryExists(owner, repoName);
      if (!exists) {
        const error = new Error(`Repository ${owner}/${repoName} not found on GitHub`);
        error.status = 404;
        throw error;
      }

      const initialTag = await githubClient.getLatestTag(owner, repoName);

      [repository] = await db('repositories')
        .insert({
          owner,
          repo: repoName,
          last_seen_tag: initialTag,
        })
        .returning('*');

      Logger.log('SubscriptionService', `Created new repository record: ${owner}/${repoName}`);
    }

    let subscriber = await db('subscribers').where({ email }).first();
    if (!subscriber) {
      [subscriber] = await db('subscribers')
        .insert({
          email,
          confirmation_token: Buffer.from(`${email}-${Date.now()}`).toString('base64'),
          unsubscribe_token: Buffer.from(`unsub-${email}-${Date.now()}`).toString('base64'),
        })
        .returning('*');

      Logger.log('SubscriptionService', `Created new subscriber: ${email}`);
    }

    if (!subscriber.confirmed) {
      await notifierService.sendConfirmationEmail(email, subscriber.confirmation_token);
    }

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
      repository_id: repository.id,
    });

    return {
      message: subscriber.confirmed
        ? 'Subscription successful'
        : 'Subscription requested. Please check your email to confirm.',
    };
  }

  async confirm(token) {
    const subscriber = await db('subscribers').where({ confirmation_token: token }).first();
    if (!subscriber) {
      const error = new Error('Invalid or expired confirmation token');
      error.status = 404;
      throw error;
    }

    if (subscriber.confirmed) {
      return { message: 'Email already confirmed' };
    }

    await db('subscribers').where({ id: subscriber.id }).update({ confirmed: true });
    Logger.log('SubscriptionService', `Subscriber confirmed: ${subscriber.email}`);

    return {
      message: 'Subscription confirmed successfully! You will now receive release notifications.',
    };
  }

  async unsubscribe(token) {
    const subscriber = await db('subscribers').where({ unsubscribe_token: token }).first();
    if (!subscriber) {
      const error = new Error('Invalid unsubscribe token');
      error.status = 404;
      throw error;
    }

    await db('subscriptions').where({ subscriber_id: subscriber.id }).del();
    Logger.log('SubscriptionService', `User unsubscribed: ${subscriber.email}`);

    return { message: 'You have been successfully unsubscribed from all notifications.' };
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

export default new SubscriptionService();
