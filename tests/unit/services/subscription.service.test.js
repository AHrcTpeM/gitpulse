import { jest } from '@jest/globals';

// 1. Mock dependencies
jest.unstable_mockModule('../../../src/db/db.js', () => {
  const queryChain = {
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    del: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    raw: jest.fn(),
  };
  const dbMock = jest.fn(() => queryChain);
  dbMock.fn = { now: jest.fn() };
  dbMock.raw = jest.fn();
  return { default: dbMock };
});

jest.unstable_mockModule('../../../src/core/clients/github.client.js', () => ({
  default: {
    repositoryExists: jest.fn(),
    getLatestTag: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/core/services/notifier.service.js', () => ({
  default: {
    sendConfirmationEmail: jest.fn(),
    notify: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/core/utils/logger.js', () => ({
  default: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// 2. Import service and mocks
const { default: subscriptionService } =
  await import('../../../src/core/services/subscription.service.js');
const { default: db } = await import('../../../src/db/db.js');
const { default: githubClient } = await import('../../../src/core/clients/github.client.js');
const { default: notifierService } = await import('../../../src/core/services/notifier.service.js');

describe('SubscriptionService', () => {
  const queryChain = db();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('subscribe', () => {
    it('should throw 400 for invalid repo format', async () => {
      await expect(subscriptionService.subscribe('a@b.com', 'invalid')).rejects.toMatchObject({
        status: 400,
      });
    });

    it('should throw 404 if repository does not exist on GitHub', async () => {
      queryChain.first.mockResolvedValueOnce(null); // Repo not in DB
      githubClient.repositoryExists.mockResolvedValue(false);

      await expect(subscriptionService.subscribe('a@b.com', 'owner/repo')).rejects.toMatchObject({
        status: 404,
      });
    });

    it('should successfully subscribe an already confirmed user', async () => {
      const email = 'confirmed@example.com';
      const repo = 'owner/repo';

      // Stage mocks: Repo exists, Subscriber exists and is confirmed
      queryChain.first
        .mockResolvedValueOnce({ id: 1, owner: 'owner', repo: 'repo' }) // Repo in DB
        .mockResolvedValueOnce({ id: 10, email, confirmed: true }) // Already confirmed
        .mockResolvedValueOnce(null); // Not subscribed yet

      const result = await subscriptionService.subscribe(email, repo);

      expect(result.message).toBe('Subscription successful');
      expect(queryChain.insert).toHaveBeenCalled();
    });

    it('should return "Subscription requested" message for an unconfirmed existing user', async () => {
      queryChain.first
        .mockResolvedValueOnce({ id: 1 }) // Repo found
        .mockResolvedValueOnce({ id: 10, confirmed: false, confirmation_token: 'tok' }) // User found but not confirmed
        .mockResolvedValueOnce(null); // Subscription doesn't exist

      const result = await subscriptionService.subscribe('a@b.com', 'owner/repo');

      expect(result.message).toContain('Subscription requested');
    });

    it('should throw 404 if repository exists on GitHub but has no tags', async () => {
      queryChain.first.mockResolvedValueOnce(null); // Repo not in DB
      githubClient.repositoryExists.mockResolvedValue(true);
      githubClient.getLatestTag.mockResolvedValue(null); // No tags found

      await expect(subscriptionService.subscribe('a@b.com', 'owner/repo')).rejects.toMatchObject({
        status: 404,
      });
    });

    it('should throw 409 if subscription already exists', async () => {
      queryChain.first
        .mockResolvedValueOnce({ id: 1 }) // Repo found in DB
        .mockResolvedValueOnce({ id: 10, confirmed: true }) // Subscriber found
        .mockResolvedValueOnce({ id: 100 }); // Subscription found

      await expect(subscriptionService.subscribe('a@b.com', 'owner/repo')).rejects.toMatchObject({
        status: 409,
      });
    });

    it('should call sendConfirmationEmail if subscriber is not confirmed', async () => {
      queryChain.first
        .mockResolvedValueOnce({ id: 1 }) // Repo found
        .mockResolvedValueOnce({ id: 10, confirmed: false, confirmation_token: 'token' }) // New/Unconfirmed subscriber
        .mockResolvedValueOnce(null); // No subscription yet

      await subscriptionService.subscribe('a@b.com', 'owner/repo');

      expect(notifierService.sendConfirmationEmail).toHaveBeenCalledWith('a@b.com', 'token');
    });

    it('should create a new subscriber and subscription if they do not exist', async () => {
      const email = 'new@example.com';
      const repo = 'owner/new-repo';

      // Stage mocks: 1. Repo not in DB, 2. Subscriber not in DB
      queryChain.first
        .mockResolvedValueOnce(null) // Repository entry check
        .mockResolvedValueOnce(null); // Subscriber entry check

      githubClient.repositoryExists.mockResolvedValue(true);
      githubClient.getLatestTag.mockResolvedValue('v1.0.0');

      // Stage return values for DB insertions
      queryChain.returning
        .mockResolvedValueOnce([{ id: 500, owner: 'owner', repo: 'new-repo' }]) // Created Repo
        .mockResolvedValueOnce([
          { id: 700, email, confirmed: false, confirmation_token: 'token-123' },
        ]); // Created Subscriber

      // Execute the service method
      await subscriptionService.subscribe(email, repo);

      // Verify a new subscriber was inserted into database
      expect(queryChain.insert).toHaveBeenCalledWith(expect.objectContaining({ email: email }));

      // Verify the final subscription relation was created with correct IDs
      expect(queryChain.insert).toHaveBeenLastCalledWith({
        subscriber_id: 700,
        repository_id: 500,
      });

      // Verify confirmation email was sent to the new subscriber
      expect(notifierService.sendConfirmationEmail).toHaveBeenCalledWith(email, 'token-123');
    });
  });

  describe('confirm', () => {
    it('should successfully confirm a subscriber', async () => {
      queryChain.first.mockResolvedValue({ id: 10, email: 'a@b.com', confirmed: false });

      const result = await subscriptionService.confirm('valid-token');

      expect(result.message).toContain('confirmed successfully');
      expect(queryChain.where).toHaveBeenCalled();
    });

    it('should return "Email already confirmed" if user is already confirmed', async () => {
      // Mock subscriber found and already confirmed
      queryChain.first.mockResolvedValue({ id: 10, email: 'a@b.com', confirmed: true });

      const result = await subscriptionService.confirm('already-done-token');

      expect(result.message).toBe('Email already confirmed');
      // Verify no update was performed
      expect(queryChain.update).not.toHaveBeenCalled();
    });

    it('should throw 404 for invalid confirmation token', async () => {
      queryChain.first.mockResolvedValue(null);
      await expect(subscriptionService.confirm('bad-token')).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe('unsubscribe', () => {
    it('should successfully unsubscribe a user', async () => {
      queryChain.first.mockResolvedValue({ id: 10, email: 'a@b.com' });

      const result = await subscriptionService.unsubscribe('unsub-token');

      expect(result.message).toContain('successfully unsubscribed');
      expect(queryChain.del).toHaveBeenCalled();
    });

    it('should throw 404 for invalid unsubscribe token', async () => {
      // Mock no subscriber found for this token
      queryChain.first.mockResolvedValue(null);

      await expect(subscriptionService.unsubscribe('bad-unsub-token')).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe('getAllByEmail', () => {
    it('should return all subscriptions for a given email', async () => {
      const mockData = [
        { email: 'a@b.com', repo: 'owner/repo', confirmed: true, last_seen_tag: 'v1' },
      ];
      queryChain.select.mockResolvedValue(mockData);

      const result = await subscriptionService.getAllByEmail('a@b.com');

      expect(result).toEqual(mockData);
      expect(queryChain.join).toHaveBeenCalledTimes(2); // Joined with subscribers and repositories
      expect(queryChain.where).toHaveBeenCalledWith('subscribers.email', 'a@b.com');
    });
  });
});
