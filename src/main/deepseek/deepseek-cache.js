const fs = require('fs');
const path = require('path');

class DeepSeekCache {
  constructor(config) {
    this.config = config;
    this.dbPath = path.join(process.env.HOME || process.env.USERPROFILE || process.cwd(), '.kid-safe-browser', 'deepseek-cache.db');
    this.memoryCache = new Map();
    this.useMemoryCache = false;
    this.initDatabase();
  }

  initDatabase() {
    try {
      const Database = require('better-sqlite3');
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.db = new Database(this.dbPath);
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS cache (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache(expires_at);
      `);
    } catch (error) {
      this.useMemoryCache = true;
      console.warn('[DeepSeekCache] Falling back to in-memory cache:', error.message);
    }

    this.cleanupTimer = setInterval(() => this.cleanExpired(), 60 * 60 * 1000);
    if (typeof this.cleanupTimer.unref === 'function') {
      this.cleanupTimer.unref();
    }
  }

  async get(key) {
    if (this.useMemoryCache) {
      const cached = this.memoryCache.get(key);
      if (!cached || cached.expires_at <= Date.now()) {
        this.memoryCache.delete(key);
        return null;
      }
      return cached.value;
    }

    const stmt = this.db.prepare('SELECT value FROM cache WHERE key = ? AND expires_at > ?');
    const row = stmt.get(key, Date.now());
    return row ? JSON.parse(row.value) : null;
  }

  async set(key, value) {
    const expiresAt = Date.now() + (this.config.ttl * 1000);
    if (this.useMemoryCache) {
      this.memoryCache.set(key, {
        value,
        created_at: Date.now(),
        expires_at: expiresAt
      });
      this.enforceSizeLimit();
      return;
    }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO cache (key, value, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(key, JSON.stringify(value), Date.now(), expiresAt);
    this.enforceSizeLimit();
  }

  cleanExpired() {
    if (this.useMemoryCache) {
      const now = Date.now();
      for (const [key, value] of this.memoryCache.entries()) {
        if (value.expires_at <= now) {
          this.memoryCache.delete(key);
        }
      }
      return;
    }

    this.db.prepare('DELETE FROM cache WHERE expires_at <= ?').run(Date.now());
  }

  enforceSizeLimit() {
    if (this.useMemoryCache) {
      const entries = [...this.memoryCache.entries()].sort((a, b) => a[1].created_at - b[1].created_at);
      while (entries.length > this.config.maxSize) {
        const oldest = entries.shift();
        if (oldest) {
          this.memoryCache.delete(oldest[0]);
        }
      }
      return;
    }

    const count = this.db.prepare('SELECT COUNT(*) AS count FROM cache').get().count;
    if (count <= this.config.maxSize) {
      return;
    }

    this.db.prepare(`
      DELETE FROM cache WHERE key IN (
        SELECT key FROM cache ORDER BY created_at ASC LIMIT ?
      )
    `).run(count - this.config.maxSize);
  }
}

module.exports = {
  DeepSeekCache
};