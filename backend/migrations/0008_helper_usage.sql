-- Usage counters for the in-site learning helper (free-tier guard).
-- Keys are one-way daily-salted hashes, never an IP or an account id. Additive only.
CREATE TABLE helper_usage (
  bucket TEXT NOT NULL,   -- 'YYYY-MM-DD' for daily rows, 'YYYY-MM-DDTHH:MM' for per-minute rows
  key TEXT NOT NULL,      -- 'site' or 'u:<hash>'
  calls INTEGER NOT NULL DEFAULT 0,
  neurons INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, key)
);
