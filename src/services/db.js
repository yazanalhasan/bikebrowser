const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

/**
 * Initialize the database
 */
function init() {
  const dbPath = path.join(__dirname, '../../data/bikebrowser.db');
  
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  
  // Read and execute schema
  const schemaPath = path.join(__dirname, '../../data/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  // Execute schema
  db.exec(schema);
  
  console.log('Database initialized at:', dbPath);
  return db;
}

/**
 * Get database instance
 */
function getDb() {
  if (!db) {
    init();
  }
  return db;
}

/**
 * Channel trust operations
 */
const channels = {
  getAll() {
    return getDb().prepare('SELECT * FROM channels ORDER BY channel_name').all();
  },
  
  getTrustLevel(channelId) {
    const result = getDb().prepare('SELECT trust_level FROM channels WHERE channel_id = ?').get(channelId);
    return result ? result.trust_level : 'unknown';
  },
  
  add(channelId, channelName, trustLevel, notes = '') {
    return getDb().prepare(
      'INSERT INTO channels (channel_id, channel_name, trust_level, parent_notes) VALUES (?, ?, ?, ?)'
    ).run(channelId, channelName, trustLevel, notes);
  },
  
  update(channelId, trustLevel, notes) {
    return getDb().prepare(
      'UPDATE channels SET trust_level = ?, parent_notes = ? WHERE channel_id = ?'
    ).run(trustLevel, notes, channelId);
  },
  
  delete(channelId) {
    return getDb().prepare('DELETE FROM channels WHERE channel_id = ?').run(channelId);
  }
};

/**
 * Video override operations
 */
const videoOverrides = {
  get(videoId) {
    return getDb().prepare('SELECT * FROM video_overrides WHERE video_id = ?').get(videoId);
  },
  
  set(videoId, decision, reason = '') {
    return getDb().prepare(
      'INSERT OR REPLACE INTO video_overrides (video_id, decision, reason) VALUES (?, ?, ?)'
    ).run(videoId, decision, reason);
  }
};

/**
 * Ranking cache operations
 */
const rankingCache = {
  get(videoId) {
    const result = getDb().prepare(
      'SELECT * FROM ranking_cache WHERE video_id = ? AND cached_date > datetime(\'now\', \'-7 days\')'
    ).get(videoId);
    
    if (result && result.features_json) {
      result.features = JSON.parse(result.features_json);
    }
    
    return result;
  },
  
  set(videoId, score, features) {
    return getDb().prepare(
      'INSERT OR REPLACE INTO ranking_cache (video_id, score, features_json) VALUES (?, ?, ?)'
    ).run(videoId, score, JSON.stringify(features));
  },

  delete(videoId) {
    return getDb().prepare('DELETE FROM ranking_cache WHERE video_id = ?').run(videoId);
  },
  
  clearOld() {
    return getDb().prepare(
      'DELETE FROM ranking_cache WHERE cached_date < datetime(\'now\', \'-30 days\')'
    ).run();
  }
};

const embedFeedback = {
  get(videoId) {
    return getDb().prepare('SELECT * FROM embed_feedback WHERE video_id = ?').get(videoId);
  },

  set(videoId, channelId, embeddable, failureReason = '') {
    const existing = this.get(videoId);
    const nextFailureCount = embeddable
      ? 0
      : (existing?.failure_count || 0) + 1;

    return getDb().prepare(
      `INSERT INTO embed_feedback (video_id, channel_id, embeddable, failure_count, failure_reason, checked_date)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(video_id) DO UPDATE SET
         channel_id = excluded.channel_id,
         embeddable = excluded.embeddable,
         failure_count = excluded.failure_count,
         failure_reason = excluded.failure_reason,
         checked_date = CURRENT_TIMESTAMP`
    ).run(videoId, channelId || null, embeddable ? 1 : 0, nextFailureCount, failureReason || '');
  },

  getChannelBlockedCount(channelId) {
    if (!channelId) {
      return 0;
    }

    const result = getDb().prepare(
      'SELECT COUNT(*) AS blocked_count FROM embed_feedback WHERE channel_id = ? AND embeddable = 0'
    ).get(channelId);

    return result?.blocked_count || 0;
  }
};

/**
 * Watch history operations (Phase 3)
 */
const watchHistory = {
  add(videoId, title, channelName, channelId, score, watchDuration) {
    return getDb().prepare(
      'INSERT INTO watch_history (video_id, title, channel_name, channel_id, score, watch_duration) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(videoId, title, channelName, channelId, score, watchDuration);
  },
  
  getRecent(limit = 50) {
    return getDb().prepare(
      'SELECT * FROM watch_history ORDER BY timestamp DESC LIMIT ?'
    ).all(limit);
  }
};

/**
 * Close database connection
 */
function close() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  init,
  getDb,
  channels,
  videoOverrides,
  rankingCache,
  embedFeedback,
  watchHistory,
  close
};
