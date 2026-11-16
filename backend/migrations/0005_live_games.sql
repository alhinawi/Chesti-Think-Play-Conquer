-- Live server-authoritative games (anti-cheat): during a match against the
-- computer, every half-move is relayed to the server, validated against the
-- stored position, and stamped with the SERVER clock. Timing measured this way
-- cannot be faked by a patched client. Additive only - nothing existing changes.

CREATE TABLE live_games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opponent TEXT NOT NULL, -- bot id, e.g. 'fischer'
  color TEXT NOT NULL CHECK (color IN ('white', 'black')), -- the user's side
  fen TEXT NOT NULL, -- current position
  moves TEXT NOT NULL DEFAULT '[]', -- JSON [{uci, side, t}] - t = server ms epoch
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished', 'abandoned')),
  game_id INTEGER REFERENCES games(id) ON DELETE SET NULL, -- the recorded game after finalize
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_live_games_user_status ON live_games(user_id, status);
CREATE INDEX idx_live_games_user_created ON live_games(user_id, created_at);
