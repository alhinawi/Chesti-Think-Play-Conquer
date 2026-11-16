-- Multi-account / device signals (anti-cheat): when a user registers, logs in,
-- or starts a live game, we record a SHA-256 hash of their IP and of a random
-- device id their browser generates. Only hashes are stored - never raw IPs or
-- device ids - so two accounts on the same network or device can be LINKED for
-- admin review without building a location database. Additive only.

CREATE TABLE account_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('ip', 'device')),
  hash TEXT NOT NULL,
  first_seen TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_seen TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (user_id, kind, hash)
);
CREATE INDEX idx_account_signals_hash ON account_signals(hash);
CREATE INDEX idx_account_signals_user ON account_signals(user_id);
