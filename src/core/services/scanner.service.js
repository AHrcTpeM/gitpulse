const cron = require('node-cron');
const db = require('../../db/db');
const githubClient = require('../clients/github.client');

class ScannerService {
  constructor() {
    this.isScanning = false;
  }

  /**
   * Запуск фонового завдання
   */
  init() {
    // Сканування щогодини (наприклад)
    // Формат: '0 * * * *' (хв год день міс день_тижня)
    // Для тестів можна поставити '*/1 * * * *' (щохвилини)
    cron.schedule('*/1 * * * *', () => { // TODO:
      console.log('[Scanner] Starting scheduled scan...');
      this.scan();
    });

    console.log('[Scanner] Engine initialized');
  }

  /**
   * Основна логіка сканування
   */
  async scan() {
    if (this.isScanning) {
      console.warn('[Scanner] Scan already in progress, skipping...');
      return;
    }

    this.isScanning = true;
    try {
      // 1. Беремо тільки ті репозиторії, у яких є хоча б один підписник
      const activeRepos = await db('repositories')
        .whereExists(function () {
          this.select('*').from('subscriptions').whereRaw('subscriptions.repository_id = repositories.id');
        });

      console.log(`[Scanner] Found ${activeRepos.length} active repositories to scan`);

      for (const repoRecord of activeRepos) {
        await this._processRepo(repoRecord);
      }

      console.log('[Scanner] Scan finished successfully');
    } catch (error) {
      console.error('[Scanner] Scan failed:', error.message);
    } finally {
      this.isScanning = false;
    }
  }

  async _processRepo(repoRecord) {
    const { id, owner, repo, last_seen_tag } = repoRecord;

    try {
      const currentTag = await githubClient.getLatestTag(owner, repo);

      if (!currentTag) return; // Релізів немає або помилка

      // Якщо це перший скан або тег змінився
      if (last_seen_tag !== currentTag) {
        console.log(`[Scanner] NEW RELEASE for ${owner}/${repo}: ${last_seen_tag || 'none'} -> ${currentTag}`);

        // Оновлюємо тег у базі
        await db('repositories')
          .where({ id })
          .update({
            last_seen_tag: currentTag,
            updated_at: db.fn.now()
          });

        // ТУТ МИ БУДЕМО ВИКЛИКАТИ NOTIFIER
        // await notifierService.notify(id, currentTag);
      }
    } catch (error) {
      console.error(`[Scanner] Error processing ${owner}/${repo}:`, error.message);
    }
  }
}

module.exports = new ScannerService();
