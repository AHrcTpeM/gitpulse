import cron from 'node-cron';
import db from '../../db/db.js';
import githubClient from '../clients/github.client.js';
import Logger from '../utils/logger.js';
import notifierService from './notifier.service.js';

class ScannerService {
  constructor() {
    this.isScanning = false;
  }

  init() {
    cron.schedule('0 * * * *', () => {
      Logger.log('Scanner', 'Starting scheduled scan...');
      this.scan();
    });

    Logger.log('Scanner', 'Engine initialized');
  }

  async scan() {
    if (this.isScanning) {
      Logger.warn('Scanner', 'Scan already in progress, skipping...');
      return;
    }

    this.isScanning = true;
    try {
      const activeRepos = await db('repositories').whereExists(function () {
        this.select('*')
          .from('subscriptions')
          .whereRaw('subscriptions.repository_id = repositories.id');
      });

      Logger.log('Scanner', `Found ${activeRepos.length} active repositories to scan`);

      for (const repoRecord of activeRepos) {
        await this._processRepo(repoRecord);
      }

      Logger.log('Scanner', 'Scan finished successfully');
    } catch (error) {
      Logger.error('Scanner', `Scan failed: ${error.message}`);
    } finally {
      this.isScanning = false;
    }
  }

  async _processRepo(repoRecord) {
    const { id, owner, repo, last_seen_tag } = repoRecord;

    try {
      const currentTag = await githubClient.getLatestTag(owner, repo);

      if (!currentTag) return;

      if (last_seen_tag !== currentTag) {
        Logger.log(
          'Scanner',
          `NEW RELEASE for ${owner}/${repo}: ${last_seen_tag || 'none'} → ${currentTag}`
        );

        await db('repositories').where({ id }).update({
          last_seen_tag: currentTag,
          updated_at: db.fn.now(),
        });

        await notifierService.notify(id, currentTag);
      }
    } catch (error) {
      Logger.error('Scanner', `Error processing ${owner}/${repo}: ${error.message}`);
    }
  }
}

export default new ScannerService();
