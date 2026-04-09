import axios from 'axios';
import { getCache, setCache } from './redis.client.js';
import Logger from '../utils/logger.js';

class GitHubClient {
  constructor() {
    this.baseUrl = 'https://api.github.com';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'GitPulse-App',
      },
    });

    if (process.env.GITHUB_TOKEN) {
      this.client.defaults.headers.common['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }
  }

  /**
   * @param {string} owner
   * @param {string} repo
   * @returns {Promise<string|null>}
   */
  async getLatestTag(owner, repo) {
    const cacheKey = `github:tag:${owner}:${repo}`;

    const cached = await getCache(cacheKey);
    if (cached !== null) {
      Logger.verbose('GitHubClient', `Cache HIT tag ${owner}/${repo} → ${cached}`);
      return cached;
    }

    try {
      let tag = null;

      try {
        const res = await this.client.get(`/repos/${owner}/${repo}/releases/latest`);
        if (res.data && res.data.tag_name) tag = res.data.tag_name;
      } catch (e) {}

      if (!tag) {
        const res = await this.client.get(`/repos/${owner}/${repo}/tags`, {
          params: { per_page: 10 },
        });
        if (res.data && res.data.length > 0) {
          tag = this._findLatestVersionTag(res.data.map((t) => t.name));
        }
      }

      if (!tag) {
        const [page1, page2] = await Promise.all([
          this.client.get(`/repos/${owner}/${repo}/tags`, { params: { per_page: 100, page: 1 } }),
          this.client.get(`/repos/${owner}/${repo}/tags`, { params: { per_page: 100, page: 2 } }),
        ]);
        const allTags = [...(page1.data || []), ...(page2.data || [])];
        if (allTags.length > 0) {
          tag = this._findLatestVersionTag(allTags.map((t) => t.name)) || allTags[0].name;
        }
      }

      if (tag) await setCache(cacheKey, tag);
      return tag;
    } catch (error) {
      return this._handleError(error, owner, repo);
    }
  }

  /**
   * @param {string} owner
   * @param {string} repo
   * @returns {Promise<boolean>}
   */
  async repositoryExists(owner, repo) {
    const cacheKey = `github:exists:${owner}:${repo}`;

    const cached = await getCache(cacheKey);
    if (cached !== null) {
      Logger.verbose('GitHubClient', `Cache HIT exists ${owner}/${repo} → ${cached}`);
      return cached === 'true';
    }

    try {
      await this.client.get(`/repos/${owner}/${repo}`);
      await setCache(cacheKey, 'true');
      return true;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        await setCache(cacheKey, 'false');
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
    const versionPattern = /^[a-z]*v?(\d+)\.(\d+)\.?(\d*).*$/i;

    const versionTags = tags
      .filter((tag) => versionPattern.test(tag))
      .map((tag) => {
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

      if (status === 404) {
        Logger.warn('GitHubClient', `No releases found for ${owner}/${repo}`);
        return null;
      }

      if (status === 403 || status === 429) {
        const resetTime = error.response.headers['x-ratelimit-reset'];
        const message = `GitHub Rate Limit exceeded. Resets at ${new Date(resetTime * 1000).toLocaleTimeString()}`;
        Logger.error('GitHubClient', message);
        const rateLimitError = new Error(message);
        rateLimitError.status = 400; // Compromise with the Swagger contract
        throw rateLimitError;
      }
    }

    Logger.error('GitHubClient', `Error fetching ${owner}/${repo}: ${error.message}`);
    throw error;
  }
}

export default new GitHubClient();
