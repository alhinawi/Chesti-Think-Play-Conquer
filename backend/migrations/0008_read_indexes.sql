-- Read-path indexes to cut D1 rows-read on the free plan.
-- Additive only: CREATE INDEX IF NOT EXISTS, no data changes. Safe to re-run.
-- Existing indexes (0001-0007) are not duplicated.

-- Leaderboard "games" (all/week) and admin top players: per-user range on played_at,
-- covering result so the scan never touches the games table.
CREATE INDEX IF NOT EXISTS idx_games_user_played_result ON games(user_id, played_at, result);

-- Admin "games this week" count: range on played_at alone.
CREATE INDEX IF NOT EXISTS idx_games_played ON games(played_at);

-- GET /api/games?result=..., its COUNT(*), per-user win/loss/draw stats and the
-- admin user profile: equality on user_id + result, ordered by played_at.
CREATE INDEX IF NOT EXISTS idx_games_user_result_played ON games(user_id, result, played_at DESC, id DESC);

-- Leaderboard per kind (rush/puzzles/daily), all-time and week: kind + created_at range,
-- covering user_id + points.
CREATE INDEX IF NOT EXISTS idx_scores_kind_created ON scores(kind, created_at, user_id, points);

-- Admin dashboard: new users since X and the latest 8 signups (ORDER BY created_at DESC, id DESC).
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC, id DESC);

-- Admin list of users excluded from the leaderboard (usually a handful of rows).
CREATE INDEX IF NOT EXISTS idx_users_excluded ON users(id DESC) WHERE leaderboard_excluded = 1;

-- Admin dashboard active-session count (expires_at > now). Token lookup already uses the primary key.
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Anti-cheat review queue: per-flag subquery counting live_games by game_id (was a full scan per row).
CREATE INDEX IF NOT EXISTS idx_live_games_game ON live_games(game_id) WHERE game_id IS NOT NULL;

-- Multi-account links: self-join on hash, covered by (hash, user_id, kind).
CREATE INDEX IF NOT EXISTS idx_account_signals_hash_user ON account_signals(hash, user_id, kind);
