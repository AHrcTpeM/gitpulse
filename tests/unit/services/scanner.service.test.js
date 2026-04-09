import { jest } from '@jest/globals';

// 1. Mock all dependencies
jest.unstable_mockModule('../../../src/db/db.js', () => {
  const queryChain = {
    whereExists: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    update: jest.fn().mockResolvedValue(1),
    select: jest.fn(),
  };
  const dbMock = jest.fn(() => queryChain);
  dbMock.fn = { now: jest.fn(() => 'now()') };
  return { default: dbMock };
});

jest.unstable_mockModule('../../../src/core/clients/github.client.js', () => ({
  default: {
    getLatestTag: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/core/services/notifier.service.js', () => ({
  default: {
    notify: jest.fn(),
  },
}));

jest.unstable_mockModule('node-cron', () => ({
  default: {
    schedule: jest.fn(),
  },
}));

// 2. Import modules
const { default: scannerService } = await import('../../../src/core/services/scanner.service.js');
const { default: db } = await import('../../../src/db/db.js');
const { default: githubClient } = await import('../../../src/core/clients/github.client.js');
const { default: notifierService } = await import('../../../src/core/services/notifier.service.js');

describe('ScannerService', () => {
  const queryChain = db();

  beforeEach(() => {
    jest.clearAllMocks();
    scannerService.isScanning = false; // Reset lock state
  });

  describe('scan', () => {
    it('should skip scanning if already in progress', async () => {
      scannerService.isScanning = true;
      await scannerService.scan();

      // Should not even look for active repos if blocked
      expect(db).not.toHaveBeenCalled();
    });

    it('should do nothing if no active repositories are found', async () => {
      // Create a spy on the internal method
      const processSpy = jest.spyOn(scannerService, '_processRepo');

      queryChain.whereExists.mockImplementation(() => ({
        // Return empty array for activeRepos
        then: (cb) => cb([]),
      }));

      await scannerService.scan();

      // Check that the internal processing method was never called
      expect(processSpy).not.toHaveBeenCalled();

      processSpy.mockRestore(); // Clean up the spy
    });

    it('should call _processRepo for each active repository found', async () => {
      const repos = [
        { id: 1, owner: 'a', repo: 'b' },
        { id: 2, owner: 'c', repo: 'd' },
      ];
      const processSpy = jest.spyOn(scannerService, '_processRepo').mockResolvedValue();

      queryChain.whereExists.mockReturnValue({
        then: (cb) => cb(repos),
      });

      await scannerService.scan();

      // Verify it tried to process both repositories
      expect(processSpy).toHaveBeenCalledTimes(2);
      expect(processSpy).toHaveBeenCalledWith(repos[0]);
      expect(processSpy).toHaveBeenCalledWith(repos[1]);
      expect(scannerService.isScanning).toBe(false);

      processSpy.mockRestore();
    });
  });

  describe('_processRepo', () => {
    it('should update database and notify when a new tag is detected', async () => {
      const repo = { id: 1, owner: 'owner', repo: 'repo', last_seen_tag: 'v1.0' };
      githubClient.getLatestTag.mockResolvedValue('v2.0');

      await scannerService._processRepo(repo);

      // Verify DB update
      expect(queryChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          last_seen_tag: 'v2.0',
        })
      );
      // Verify notification call
      expect(notifierService.notify).toHaveBeenCalledWith(1, 'v2.0');
    });

    it('should do nothing if tag is the same', async () => {
      const repo = { id: 1, last_seen_tag: 'v1.0' };
      githubClient.getLatestTag.mockResolvedValue('v1.0');

      await scannerService._processRepo(repo);

      expect(queryChain.update).not.toHaveBeenCalled();
      expect(notifierService.notify).not.toHaveBeenCalled();
    });

    it('should do nothing if no tags are found on GitHub', async () => {
      const repo = { id: 1, last_seen_tag: 'v1.0' };
      githubClient.getLatestTag.mockResolvedValue(null); // No tags found

      await scannerService._processRepo(repo);

      expect(queryChain.update).not.toHaveBeenCalled();
      expect(notifierService.notify).not.toHaveBeenCalled();
    });

    it('should handle errors during processing gracefully', async () => {
      const repo = { id: 1, owner: 'owner', repo: 'repo' };
      githubClient.getLatestTag.mockRejectedValue(new Error('GitHub Down'));

      // This should NOT throw, because of try/catch inside _processRepo
      await expect(scannerService._processRepo(repo)).resolves.not.toThrow();
    });
  });
});
