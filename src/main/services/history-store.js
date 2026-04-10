// src/main/services/history-store.js
// Persistent search session history using better-sqlite3.
//
// Architecture decision: SQLite is used instead of JSON files because search history
// grows unbounded and needs indexed queries (find similar, recent, by project).
// better-sqlite3 is already in package.json and is synchronous — perfect for Electron main.
//
// Tables:
//   search_sessions  — one row per pipeline invocation (text/voice/image)
//   search_results   — top results from each session (max 10 per session)
//   user_decisions    — chosen/rejected/preferred item decisions
//   compatibility_profiles — saved bike profiles for compatibility scoring

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS search_sessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  input_mode    TEXT NOT NULL DEFAULT 'text',
  raw_input     TEXT NOT NULL DEFAULT '',
  intent        TEXT NOT NULL DEFAULT 'search',
  entities_json TEXT,
  filters_json  TEXT,
  compatibility_json TEXT,
  confidence    REAL NOT NULL DEFAULT 0,
  generated_query TEXT NOT NULL DEFAULT '',
  results_count INTEGER NOT NULL DEFAULT 0,
  source        TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS search_results (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  INTEGER NOT NULL REFERENCES search_sessions(id) ON DELETE CASCADE,
  title       TEXT,
  url         TEXT,
  source      TEXT,
  category    TEXT,
  score       REAL DEFAULT 0,
  rank        INTEGER DEFAULT 0,
  metadata_json TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_decisions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  INTEGER REFERENCES search_sessions(id) ON DELETE SET NULL,
  project_id  TEXT,
  item_title  TEXT NOT NULL,
  item_url    TEXT,
  item_source TEXT,
  item_category TEXT,
  decision    TEXT NOT NULL CHECK(decision IN ('preferred','rejected','saved','opened')),
  reason      TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS compatibility_profiles (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  bike_type   TEXT,
  wheel_size  TEXT,
  voltage     TEXT,
  motor_type  TEXT,
  brake_type  TEXT,
  frame_type  TEXT,
  extras_json TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_created ON search_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_mode    ON search_sessions(input_mode);
CREATE INDEX IF NOT EXISTS idx_results_session  ON search_results(session_id);
CREATE INDEX IF NOT EXISTS idx_decisions_item   ON user_decisions(item_title);
CREATE INDEX IF NOT EXISTS idx_decisions_decision ON user_decisions(decision);
`;

class HistoryStore {
  constructor(dbPath) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.exec(SCHEMA);

    // Prepare commonly-used statements
    this._insertSession = this.db.prepare(`
      INSERT INTO search_sessions
        (input_mode, raw_input, intent, entities_json, filters_json, compatibility_json,
         confidence, generated_query, results_count, source)
      VALUES (@input_mode, @raw_input, @intent, @entities_json, @filters_json,
              @compatibility_json, @confidence, @generated_query, @results_count, @source)
    `);

    this._insertResult = this.db.prepare(`
      INSERT INTO search_results (session_id, title, url, source, category, score, rank, metadata_json)
      VALUES (@session_id, @title, @url, @source, @category, @score, @rank, @metadata_json)
    `);

    this._insertDecision = this.db.prepare(`
      INSERT INTO user_decisions
        (session_id, project_id, item_title, item_url, item_source, item_category, decision, reason)
      VALUES (@session_id, @project_id, @item_title, @item_url, @item_source, @item_category,
              @decision, @reason)
    `);

    this._insertProfile = this.db.prepare(`
      INSERT INTO compatibility_profiles
        (name, bike_type, wheel_size, voltage, motor_type, brake_type, frame_type, extras_json)
      VALUES (@name, @bike_type, @wheel_size, @voltage, @motor_type, @brake_type, @frame_type, @extras_json)
    `);
  }

  // ── Search sessions ──────────────────────────────────────────────────────

  saveSearchSession(normalizedIntent, generatedQuery, resultsCount, topResults = []) {
    const sessionInfo = this._insertSession.run({
      input_mode: normalizedIntent.inputMode || 'text',
      raw_input: normalizedIntent.rawInput || '',
      intent: normalizedIntent.intent || 'search',
      entities_json: JSON.stringify(normalizedIntent.entities || {}),
      filters_json: JSON.stringify(normalizedIntent.filters || {}),
      compatibility_json: JSON.stringify(normalizedIntent.compatibilityHints || {}),
      confidence: normalizedIntent.confidence || 0,
      generated_query: generatedQuery || '',
      results_count: resultsCount || 0,
      source: normalizedIntent.inputMode || 'text'
    });

    const sessionId = sessionInfo.lastInsertRowid;

    // Store top results (max 10)
    const limited = topResults.slice(0, 10);
    const insertMany = this.db.transaction((items) => {
      for (let i = 0; i < items.length; i++) {
        const r = items[i];
        this._insertResult.run({
          session_id: sessionId,
          title: r.title || '',
          url: r.url || '',
          source: r.source || '',
          category: r.category || '',
          score: r.compositeScore || r.score || 0,
          rank: i + 1,
          metadata_json: JSON.stringify({
            safety_score: r.safety_score,
            relevance_score: r.relevance_score,
            educational_score: r.educational_score,
            _provider: r._provider
          })
        });
      }
    });
    insertMany(limited);

    return Number(sessionId);
  }

  getHistory(limit = 50, offset = 0) {
    const sessions = this.db.prepare(`
      SELECT * FROM search_sessions
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    return sessions.map((s) => ({
      ...s,
      entities: JSON.parse(s.entities_json || '{}'),
      filters: JSON.parse(s.filters_json || '{}'),
      compatibility: JSON.parse(s.compatibility_json || '{}')
    }));
  }

  getSessionResults(sessionId) {
    return this.db.prepare(`
      SELECT * FROM search_results WHERE session_id = ? ORDER BY rank ASC
    `).all(sessionId);
  }

  getSessionWithResults(sessionId) {
    const session = this.db.prepare('SELECT * FROM search_sessions WHERE id = ?').get(sessionId);
    if (!session) return null;
    const results = this.getSessionResults(sessionId);
    return {
      ...session,
      entities: JSON.parse(session.entities_json || '{}'),
      filters: JSON.parse(session.filters_json || '{}'),
      compatibility: JSON.parse(session.compatibility_json || '{}'),
      results
    };
  }

  // ── User decisions ───────────────────────────────────────────────────────

  saveDecision({ sessionId, projectId, itemTitle, itemUrl, itemSource, itemCategory, decision, reason }) {
    return this._insertDecision.run({
      session_id: sessionId || null,
      project_id: projectId || null,
      item_title: itemTitle || '',
      item_url: itemUrl || '',
      item_source: itemSource || '',
      item_category: itemCategory || '',
      decision: decision || 'preferred',
      reason: reason || null
    });
  }

  getDecisions(limit = 100) {
    return this.db.prepare(`
      SELECT * FROM user_decisions ORDER BY created_at DESC LIMIT ?
    `).all(limit);
  }

  getRejectedItems() {
    return this.db.prepare(`
      SELECT item_title, item_source, item_category, COUNT(*) as rejection_count
      FROM user_decisions
      WHERE decision = 'rejected'
      GROUP BY item_title
      ORDER BY rejection_count DESC
    `).all();
  }

  getPreferredItems() {
    return this.db.prepare(`
      SELECT item_title, item_source, item_category, COUNT(*) as preference_count
      FROM user_decisions
      WHERE decision = 'preferred'
      GROUP BY item_title
      ORDER BY preference_count DESC
    `).all();
  }

  // ── Compatibility profiles ───────────────────────────────────────────────

  saveProfile({ name, bikeType, wheelSize, voltage, motorType, brakeType, frameType, extras }) {
    const info = this._insertProfile.run({
      name: name || 'My Bike',
      bike_type: bikeType || null,
      wheel_size: wheelSize || null,
      voltage: voltage || null,
      motor_type: motorType || null,
      brake_type: brakeType || null,
      frame_type: frameType || null,
      extras_json: JSON.stringify(extras || {})
    });
    return Number(info.lastInsertRowid);
  }

  getProfiles() {
    return this.db.prepare('SELECT * FROM compatibility_profiles ORDER BY updated_at DESC').all()
      .map((p) => ({ ...p, extras: JSON.parse(p.extras_json || '{}') }));
  }

  getProfile(id) {
    const p = this.db.prepare('SELECT * FROM compatibility_profiles WHERE id = ?').get(id);
    return p ? { ...p, extras: JSON.parse(p.extras_json || '{}') } : null;
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────

  pruneOldSessions(keepDays = 90) {
    const cutoff = new Date(Date.now() - keepDays * 86400000).toISOString();
    this.db.prepare('DELETE FROM search_sessions WHERE created_at < ?').run(cutoff);
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = { HistoryStore };
