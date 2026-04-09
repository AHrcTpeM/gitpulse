import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index.js';
import { setupDatabase, clearDatabase, closeDatabase } from './setup.js';
import mailClient from '../../src/core/clients/mail.client.js';
import db from '../../src/db/db.js';
import Logger from '../../src/core/utils/logger.js';

const TEST_API_KEY = 'test-secret-key';

describe('Subscription API Integration Tests', () => {
  beforeAll(async () => {
    process.env.API_KEY = TEST_API_KEY;
    await setupDatabase();
    // Spy on mailClient.send to prevent actual emails and verify calls
    jest.spyOn(mailClient, 'send').mockImplementation(async () => true);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  describe('POST /api/subscribe', () => {
    it('should create a new subscription and send confirmation email', async () => {
      const res = await request(app).post('/api/subscribe').set('x-api-key', TEST_API_KEY).send({
        email: 'test@example.com',
        repo: 'facebook/react',
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Subscription requested');

      // Verify email was "sent"
      expect(mailClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/confirm/:token', () => {
    it('should confirm a subscription', async () => {
      // Seed a subscriber
      const [subscriber] = await db('subscribers')
        .insert({
          email: 'confirm@example.com',
          confirmation_token: 'valid-token',
          unsubscribe_token: 'unsub-token',
        })
        .returning('*');

      const res = await request(app).get(`/api/confirm/${subscriber.confirmation_token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('confirmed successfully');

      // Verify DB update
      const updated = await db('subscribers').where({ id: subscriber.id }).first();
      expect(updated.confirmed).toBe(true);
    });

    it('should return 404 for invalid token', async () => {
      const res = await request(app).get('/api/confirm/invalid-token');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/unsubscribe/:token', () => {
    it('should unsubscribe a user from all repos', async () => {
      // Seed subscriber and repository
      const [subscriber] = await db('subscribers')
        .insert({
          email: 'unsub@example.com',
          confirmation_token: 'c1',
          unsubscribe_token: 'u1',
          confirmed: true,
        })
        .returning('*');

      const [repo] = await db('repositories')
        .insert({ owner: 'owner', repo: 'repo' })
        .returning('*');

      await db('subscriptions').insert({
        subscriber_id: subscriber.id,
        repository_id: repo.id,
      });

      const res = await request(app).get(`/api/unsubscribe/${subscriber.unsubscribe_token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('successfully unsubscribed');

      // Verify subscription deleted
      const subs = await db('subscriptions').where({ subscriber_id: subscriber.id });
      expect(subs.length).toBe(0);
    });
  });

  describe('GET /api/subscriptions', () => {
    it('should list all subscriptions for an email', async () => {
      const email = 'list@example.com';
      const [subscriber] = await db('subscribers')
        .insert({
          email,
          confirmation_token: 'c2',
          unsubscribe_token: 'u2',
        })
        .returning('*');

      const [repo] = await db('repositories')
        .insert({ owner: 'facebook', repo: 'react' })
        .returning('*');

      await db('subscriptions').insert({
        subscriber_id: subscriber.id,
        repository_id: repo.id,
      });

      const res = await request(app)
        .get('/api/subscriptions')
        .set('x-api-key', TEST_API_KEY)
        .query({ email });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].repo).toBe('facebook/react');
    });

    it('should return 401 without API key', async () => {
      const res = await request(app).get('/api/subscriptions').query({ email: 'any@mail.com' });
      expect(res.status).toBe(401);
    });
  });
});
