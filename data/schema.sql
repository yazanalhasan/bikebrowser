-- BikeBrowser Database Schema
-- SQLite database for storing trust lists, history, builds, and missions

-- Channel trust list
CREATE TABLE IF NOT EXISTS channels (
  channel_id TEXT PRIMARY KEY,
  channel_name TEXT NOT NULL,
  trust_level TEXT NOT NULL CHECK(trust_level IN ('trusted', 'allowed', 'blocked')),
  parent_notes TEXT,
  added_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Video-specific overrides
CREATE TABLE IF NOT EXISTS video_overrides (
  video_id TEXT PRIMARY KEY,
  decision TEXT NOT NULL CHECK(decision IN ('prioritize', 'allow', 'downrank', 'block')),
  reason TEXT,
  override_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Watch history (Phase 3)
CREATE TABLE IF NOT EXISTS watch_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT NOT NULL,
  title TEXT,
  channel_name TEXT,
  channel_id TEXT,
  score REAL,
  watch_duration INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ranking cache to avoid re-scoring
CREATE TABLE IF NOT EXISTS ranking_cache (
  video_id TEXT PRIMARY KEY,
  score REAL NOT NULL,
  features_json TEXT,
  cached_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS embed_feedback (
  video_id TEXT PRIMARY KEY,
  channel_id TEXT,
  embeddable INTEGER NOT NULL DEFAULT 1,
  failure_count INTEGER NOT NULL DEFAULT 0,
  failure_reason TEXT,
  checked_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Saved builds (Phase 4)
CREATE TABLE IF NOT EXISTS saved_builds (
  build_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_cost REAL DEFAULT 0
);

-- Parts in builds (Phase 4)
CREATE TABLE IF NOT EXISTS build_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_id TEXT NOT NULL,
  part_name TEXT NOT NULL,
  price REAL,
  platform TEXT,
  url TEXT,
  image_url TEXT,
  added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (build_id) REFERENCES saved_builds(build_id) ON DELETE CASCADE
);

-- Mission definitions (Phase 5)
CREATE TABLE IF NOT EXISTS missions (
  mission_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  criteria_json TEXT,
  is_active INTEGER DEFAULT 1,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Mission progress tracking (Phase 5)
CREATE TABLE IF NOT EXISTS mission_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_id TEXT NOT NULL,
  progress_count INTEGER DEFAULT 0,
  completed_date DATETIME,
  FOREIGN KEY (mission_id) REFERENCES missions(mission_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_watch_history_timestamp ON watch_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_watch_history_video ON watch_history(video_id);
CREATE INDEX IF NOT EXISTS idx_ranking_cache_date ON ranking_cache(cached_date);
CREATE INDEX IF NOT EXISTS idx_embed_feedback_channel ON embed_feedback(channel_id);
CREATE INDEX IF NOT EXISTS idx_build_parts_build ON build_parts(build_id);

-- Insert default trusted channels for MVP
INSERT OR IGNORE INTO channels (channel_id, channel_name, trust_level, parent_notes) VALUES
  ('UCzaZ1sPWVUDZT-X_xp9NtZQ', 'Park Tool', 'trusted', 'Professional bike repair tutorials'),
  ('UCu8YylsPiu9XfaQC74Hr_Gw', 'Seth''s Bike Hacks', 'trusted', 'Fun and educational mountain bike content'),
  ('UCuNxAL8oqUU3b9RddA4kOaA', 'GMBN', 'trusted', 'Global Mountain Bike Network - educational'),
  ('UCIaBPnpnMuf5atEEkaGsUTQ', 'GCN Tech', 'trusted', 'Technical cycling content'),
  ('UCK31gFRaGHEKuWVLJQGU_Vw', 'BikeRadar', 'trusted', 'Bike reviews and tutorials'),
  ('UCXfWwFAut1fTLIdxG9R9odA', 'RJ The Bike Guy', 'trusted', 'Bike repair and maintenance'),
  ('UCEyKfnq_A3dDYdR0rEODNLg', 'Berm Peak', 'trusted', 'Mountain bike building and trail projects'),
  ('UCqGGlEhqhGjZfJZqGzyzM4Q', 'BikemanforU', 'trusted', 'Bike building and repair'),
  ('UCcEJyzW3tSEUbSev3rRc2Sw', 'EMBN', 'trusted', 'Electric Mountain Bike Network'),
  ('UC6Dt6OC3jfYFxkDpM0CcNbA', 'Just Riding Along', 'trusted', 'Bike repair and mechanics');
