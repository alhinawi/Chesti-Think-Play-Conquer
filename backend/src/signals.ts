// Account-linking signals (anti-cheat). On register/login/live-game start we
// store SHA-256 hashes of the request IP and of a random per-browser device id
// the client sends. Raw IPs and device ids are never stored: the hashes exist
// only to answer "have we seen this exact same value on another account?".
// A shared hash is a REVIEW HINT, not proof - families share IPs, cafés share
// networks - so it only feeds the admin's judgment, never an automatic action.

import { sha256Hex } from './crypto'

const DEVICE_RE = /^[A-Za-z0-9-]{8,64}$/

async function upsert(db: D1Database, userId: number, kind: 'ip' | 'device', hash: string) {
  await db
    .prepare(
      `INSERT INTO account_signals (user_id, kind, hash) VALUES (?, ?, ?)
       ON CONFLICT (user_id, kind, hash) DO UPDATE SET last_seen = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    )
    .bind(userId, kind, hash)
    .run()
}

/** Fire-and-forget: signal recording must never break auth or gameplay. */
export async function recordAccountSignals(
  db: D1Database,
  userId: number,
  ip: string | null | undefined,
  deviceId: string | null | undefined,
) {
  try {
    if (ip && ip.length <= 64) await upsert(db, userId, 'ip', await sha256Hex(ip))
    if (deviceId && DEVICE_RE.test(deviceId)) await upsert(db, userId, 'device', await sha256Hex(deviceId))
  } catch (e) {
    console.error('recordAccountSignals failed', e)
  }
}
