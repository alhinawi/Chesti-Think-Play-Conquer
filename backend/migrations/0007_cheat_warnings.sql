-- Soft cheater warnings (anti-cheat): polite, firm, no accusation of certainty.
-- Auto-created when a game's risk crosses the danger threshold, or by the admin
-- with one tap. Rate-limited per user. Additive only.

CREATE TABLE cheat_warnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('auto', 'admin')),
  message TEXT NOT NULL,
  risk_score INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  seen_at TEXT
);
CREATE INDEX idx_cheat_warnings_user ON cheat_warnings(user_id, created_at);
