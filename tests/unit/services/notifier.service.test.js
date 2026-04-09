import { jest } from '@jest/globals';

// 1. Mock dependencies
jest.unstable_mockModule('../../../src/db/db.js', () => {
  const queryChain = {
    join: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn(),
  };
  const dbMock = jest.fn(() => queryChain);
  return { default: dbMock };
});

jest.unstable_mockModule('../../../src/core/clients/mail.client.js', () => ({
  default: {
    send: jest.fn().mockResolvedValue(true),
  },
}));

jest.unstable_mockModule('../../../src/core/utils/template.engine.js', () => ({
  default: {
    confirmation: jest.fn(() => 'html-content'),
    newRelease: jest.fn(() => 'html-content'),
  },
}));

// 2. Import modules
const { default: notifierService } = await import('../../../src/core/services/notifier.service.js');
const { default: mailClient } = await import('../../../src/core/clients/mail.client.js');
const { default: db } = await import('../../../src/db/db.js');
const { default: TemplateEngine } = await import('../../../src/core/utils/template.engine.js');

describe('NotifierService', () => {
  const queryChain = db();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendConfirmationEmail', () => {
    it('should call mailClient.send with confirmation link object', async () => {
      const email = 'test@example.com';
      const token = 'token123';

      await notifierService.sendConfirmationEmail(email, token);

      // Verify TemplateEngine was called
      expect(TemplateEngine.confirmation).toHaveBeenCalledWith(expect.stringContaining(token));

      // Verify mailClient received the mocked HTML
      expect(mailClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          html: 'html-content',
        })
      );
    });
  });

  describe('notify', () => {
    it('should find subscribers and send them notifications', async () => {
      const repositoryId = 1;
      const newTag = 'v2.0.0';
      const subscribers = [
        { email: 'user1@example.com', owner: 'owner', repo: 'repo', unsubscribe_token: 'token1' },
        { email: 'user2@example.com', owner: 'owner', repo: 'repo', unsubscribe_token: 'token2' },
      ];

      // Mock DB results for subscribers of this repo
      queryChain.select.mockResolvedValue(subscribers);

      await notifierService.notify(repositoryId, newTag);

      // Verify mail was sent to both users with correct structure
      expect(mailClient.send).toHaveBeenCalledTimes(2);
      expect(TemplateEngine.newRelease).toHaveBeenCalledTimes(2);

      expect(mailClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user1@example.com',
          html: 'html-content',
        })
      );
      expect(mailClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user2@example.com',
          html: 'html-content',
        })
      );
    });

    it('should do nothing if no subscribers found', async () => {
      queryChain.select.mockResolvedValue([]);

      await notifierService.notify(1, 'v1');

      expect(mailClient.send).not.toHaveBeenCalled();
    });
  });
});
