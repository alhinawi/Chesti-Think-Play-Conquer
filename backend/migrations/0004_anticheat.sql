-- Anti-cheat: additive only. Telemetry per recorded game, a flag/review queue,
-- and a soft leaderboard-exclusion switch on users.

ALTER TABLE users ADD COLUMN leaderboard_excluded INTEGER NOT NULL DEFAULT 0;

-- Client-reported timing/environment signals for one recorded game.
CREATE TABLE game_telemetry (
  game_id INTEGER PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  move_times TEXT, -- JSON array of milliseconds per user move
  signals TEXT, -- JSON object {blurs, pastes, focus_losses, level}
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_game_telemetry_user ON game_telemetry(user_id);

-- One row per suspicious game: the review queue. Soft actions only -
-- nothing here deletes games, points, or accounts.
CREATE TABLE game_flags (
  game_id INTEGER PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  reasons TEXT NOT NULL, -- JSON array of reason codes
  status TEXT NOT NULL DEFAULT 'flagged' CHECK (status IN ('flagged', 'dismissed', 'confirmed')),
  engine_match REAL, -- 0..1 share of user moves equal to the analyzer's best move
  engine_top3 REAL, -- 0..1 share inside the analyzer's top 3
  acpl REAL, -- average centipawn loss vs the analyzer
  analyzed_at TEXT,
  review_note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_game_flags_status_score ON game_flags(status, risk_score DESC);
CREATE INDEX idx_game_flags_user ON game_flags(user_id);
