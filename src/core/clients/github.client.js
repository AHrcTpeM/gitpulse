const axios = require('axios');

class GitHubClient {
  constructor() {
    this.baseUrl = 'https://api.github.com';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitPulse-App' // GitHub вимагає User-Agent
      }
    });

    // Якщо є токен у .env, додаємо його (збільшує ліміт з 60 до 5000 запитів/год)
    if (process.env.GITHUB_TOKEN) {
      this.client.defaults.headers.common['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }
  }

  /**
   * Отримати останній тег релізу для репозиторію
   * @param {string} owner 
   * @param {string} repo 
   * @returns {Promise<string|null>}
   */
  async getLatestTag(owner, repo) {
    try {
      // 1. Пробуємо офіційний "Latest Release"
      try {
        const releaseResponse = await this.client.get(`/repos/${owner}/${repo}/releases/latest`);
        if (releaseResponse.data && releaseResponse.data.tag_name) {
          return releaseResponse.data.tag_name;
        }
      } catch (e) {
        // Пропускаємо і йдемо до фолбеку
      }

      // 2. Якщо "Latest" не встановлено, беремо найперший зі списку релізів
      const allReleasesResponse = await this.client.get(`/repos/${owner}/${repo}/releases`, {
        params: { per_page: 1 }
      });
      
      if (allReleasesResponse.data && allReleasesResponse.data.length > 0) {
        return allReleasesResponse.data[0].tag_name;
      }

      // 3. Якщо релізів взагалі немає, беремо теги та фільтруємо
      // Беремо більше тегів, бо перший у списку може бути старим
      const [tagsPage1, tagsPage2] = await Promise.all([
        this.client.get(`/repos/${owner}/${repo}/tags`, { params: { per_page: 100, page: 1 } }),
        this.client.get(`/repos/${owner}/${repo}/tags`, { params: { per_page: 100, page: 2 } }),
      ]);

      const allTags = [
        ...(tagsPage1.data || []),
        ...(tagsPage2.data || []),
      ];

      if (allTags.length > 0) {
        const versionTag = this._findLatestVersionTag(allTags.map(t => t.name));
        if (versionTag) return versionTag;
        // Якщо semver не знайшли — повертаємо просто перший
        return allTags[0].name;
      }

      return null;
    } catch (error) {
      return this._handleError(error, owner, repo);
    }
  }

  /**
   * Перевірити чи існує репозиторій
   * @param {string} owner 
   * @param {string} repo 
   * @returns {Promise<boolean>}
   */
  async repositoryExists(owner, repo) {
    try {
      await this.client.get(`/repos/${owner}/${repo}`);
      return true;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Знаходить найсвіжішу версію серед списку тегів за semver-патерном.
   * Підтримує формати: v1.2.3, go1.22.1, 1.2.3
   */
  _findLatestVersionTag(tags) {
    // Відбираємо тільки ті теги, що схожі на версії (містять цифри з крапками)
    const versionPattern = /^[a-z]*v?(\d+)\.(\d+)\.?(\d*).*$/i;

    const versionTags = tags
      .filter(tag => versionPattern.test(tag))
      .map(tag => {
        const match = tag.match(/(\d+)\.(\d+)\.?(\d*)/);
        return {
          name: tag,
          major: parseInt(match[1]) || 0,
          minor: parseInt(match[2]) || 0,
          patch: parseInt(match[3]) || 0,
        };
      })
      .sort((a, b) => {
        if (a.major !== b.major) return b.major - a.major;
        if (a.minor !== b.minor) return b.minor - a.minor;
        return b.patch - a.patch;
      });

    return versionTags.length > 0 ? versionTags[0].name : null;
  }

  _handleError(error, owner, repo) {
    if (error.response) {
      const status = error.response.status;
      
      // Специфічна помилка 404 (може не бути релізів взагалі)
      if (status === 404) {
        console.warn(`[GitHubClient] No releases found for ${owner}/${repo}`);
        return null;
      }

      // Специфічна помилка 429 (Rate Limit)
      if (status === 403 || status === 429) {
        const resetTime = error.response.headers['x-ratelimit-reset'];
        const message = `GitHub Rate Limit exceeded. Resets at ${new Date(resetTime * 1000).toLocaleTimeString()}`;
        console.error(`[GitHubClient] ${message}`);
        
        const rateLimitError = new Error(message);
        rateLimitError.status = 429;
        throw rateLimitError;
      }
    }
    
    console.error(`[GitHubClient] Error fetching ${owner}/${repo}:`, error.message);
    throw error;
  }
}

module.exports = new GitHubClient();
