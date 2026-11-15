# Chesti API

Free backend for Chesti: accounts, saved games, leaderboard, and progress sync.
Runs on Cloudflare Workers + D1 (Hono, TypeScript). No server to pay for.

Status: built and tested locally. **Not deployed.** See `SETUP.ar.md` for the deploy steps.

## Run it locally

```bash
cd backend
npm install --legacy-peer-deps
npm run db:migrate:local      # creates the local SQLite database
node seed/make-seed.mjs && npm run db:seed:local   # optional demo players (password: demo-pass-123)
npm run dev                   # http://localhost:8787/api/ping
npm test                      # 22 tests on a local D1
npm run typecheck
```

Nothing here touches Cloudflare. `database_id` in `wrangler.jsonc` is a placeholder used only locally.

## Design notes

- Passwords: PBKDF2-SHA256, 100,000 iterations (the Workers maximum), random salt per user.
- Login token: 32 random bytes, valid 30 days. Only its SHA-256 is stored, so a leaked database does not leak logins.
- Send it as `Authorization: Bearer <token>`.
- CORS: only origins listed in `ALLOWED_ORIGINS` (wrangler.jsonc `vars`) may call from a browser.
- Players only ever see their own games. The public leaderboard shows name, rank and points only, never email.
- There is no rate limit inside the code. Turn on Cloudflare's free rate limiting or WAF rule for `/api/auth/*` after deploy.

## API

Base: `/api`. All bodies are JSON. Errors: `{"error": "code"}`; validation errors are 422 with `{"error":"validation_failed","fields":{...}}`.

### Auth

| Method | Path | Body | Result |
|---|---|---|---|
| POST | `/auth/register` | `name` (2-40), `email`, `password` (8+) | 201 `{user, token}` |
| POST | `/auth/login` | `email`, `password` | 200 `{user, token}`, or 401 `invalid_credentials` |
| POST | `/auth/logout` | | 200, token stops working (login needed) |
| GET | `/me` | | `{user}` (login needed) |
| PATCH | `/me` | `name` | `{user}` (login needed) |

### Games (login needed, own games only)

| Method | Path | Notes |
|---|---|---|
| POST | `/games` | `result` required: `win` `loss` `draw`. Optional: `mode` (`computer` `local`), `opponent` (bot id), `color`, `pgn` (max 20000), `moves`, `duration_seconds`, `played_at` (ISO date, not future). 201 `{game}` |
| GET | `/games` | `?result=win&page=1&per_page=20` (max 100). Newest first. `{games, page, per_page, total}` |
| GET | `/games/stats` | `{stats: {games, wins, losses, draws, win_rate}}` |
| GET | `/games/:id` | `{game}` or 404 |
| DELETE | `/games/:id` | 204 or 404 |

### Scores (login needed)

| Method | Path | Notes |
|---|---|---|
| POST | `/scores` | `kind`: `rush` `puzzles` `daily`; `points` 0-100000. 201 `{score, best}` |
| GET | `/scores/mine` | `{scores: [{kind, best, attempts}]}` |

### Leaderboard (public)

`GET /leaderboard?kind=games|rush|puzzles|daily&period=all|week&limit=20`

- `kind=games` (default): 3 points per win, 1 per draw. Entry: `{rank, user_id, name, games, wins, points}`.
- `kind=rush|puzzles|daily`: each player's best score. Entry: `{rank, user_id, name, points}`.

### Progress sync (login needed)

Same JSON the site keeps in localStorage under `chesti-progress`, so a player can continue on another device.

- `GET /progress` returns `{progress, updated_at}` (`progress` is `null` until first save).
- `PUT /progress` replaces it. Accepted keys: `lessons puzzles traps openings endgames daily days` (arrays of strings), `wins` (object of integers), `games` (integer), `guesses` (object). Other keys are dropped.

### Example

```bash
curl -X POST http://localhost:8787/api/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"Hinawi","email":"me@example.com","password":"longpassword1"}'
curl -X POST http://localhost:8787/api/games -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"result":"win","opponent":"bot-2","pgn":"1. e4 e5","moves":2}'
curl "http://localhost:8787/api/leaderboard?limit=10"
```

## Layout

```
backend/
  src/index.ts        routes
  src/crypto.ts       password + token hashing
  src/validate.ts     input checks
  migrations/         D1 schema
  seed/               demo data (local only)
  test/               vitest on local D1
  SETUP.ar.md         deploy guide (Arabic)
```
