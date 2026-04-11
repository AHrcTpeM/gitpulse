import { jest } from '@jest/globals';
import { setupDatabase, clearDatabase, closeDatabase } from './setup.js';
import db from '../../src/db/db.js';
import scannerService from '../../src/core/services/scanner.service.js';
import githubClient from '../../src/core/clients/github.client.js';
import mailClient from '../../src/core/clients/mail.client.js';
import Logger from '../../src/core/utils/logger.js';

describe('Scanner & Notifier Integration Flow', () => {
  beforeAll(async () => {
    await setupDatabase();
    jest.spyOn(mailClient, 'send').mockImplementation(async () => true);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  it('should detect new tag, update DB and notify subscribers', async () => {
    // 1. Seed data
    const [repo] = await db('repositories')
      .insert({
        owner: 'test-owner',
        repo: 'test-repo',
        last_seen_tag: 'v1.0.0',
      })
      .returning('*');

    const [subscriber] = await db('subscribers')
      .insert({
        email: 'subscriber@example.com',
        confirmed: true,
        confirmation_token: 'c1',
        unsubscribe_token: 'u1',
      })
      .returning('*');

    await db('subscriptions').insert({
      subscriber_id: subscriber.id,
      repository_id: repo.id,
    });

    // 2. Mock GitHub to return a NEW tag
    jest.spyOn(githubClient, 'getLatestTag').mockResolvedValue('v1.1.0');

    // 3. Run scanner logic
    // We call the internal _processRepo or scan()
    // Since scan() searches for all repos, it should find our seeded one
    await scannerService.scan();

    // 4. Verify Repository was updated in DB
    const updatedRepo = await db('repositories').where({ id: repo.id }).first();
    expect(updatedRepo.last_seen_tag).toBe('v1.1.0');

    // 5. Verify Notifier sent an email
    expect(mailClient.send).toHaveBeenCalledTimes(1);
    expect(mailClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'subscriber@example.com',
        subject: expect.stringContaining('v1.1.0'),
      })
    );
  });
});
