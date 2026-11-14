// Online games with a friend over Supabase Realtime (broadcast + presence, no tables).
// This file holds the pure parts: room codes, seats and merging two copies of a game.

export type Color = 'w' | 'b'

export interface OnlineGame {
  /** random id of this game; a rematch starts a new one */
  id: string
  /** ms timestamp; the newer game wins when two copies disagree */
  startedAt: number
  /** UCI moves */
  moves: string[]
  resigned: Color | null
}

/** player id -> colour */
export type Seats = Record<string, Color>

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O, 1/I

export function makeRoomCode(rand: () => number = Math.random, len = 6) {
  let s = ''
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(rand() * ALPHABET.length)]
  return s
}

export function normalizeRoomCode(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (s.length < 4 || s.length > 12) return null
  return s
}

export function newGame(rand: () => number = Math.random, now = Date.now()): OnlineGame {
  return { id: makeRoomCode(rand, 8), startedAt: now, moves: [], resigned: null }
}

function isPrefix(a: string[], b: string[]) {
  return a.length <= b.length && a.every((m, i) => b[i] === m)
}

/** Decide which copy of the game to keep after hearing from the other player. */
export function mergeGame(local: OnlineGame, remote: OnlineGame): OnlineGame {
  if (remote.id !== local.id) return remote.startedAt > local.startedAt ? remote : local
  let moves = local.moves
  if (remote.moves.length > local.moves.length && isPrefix(local.moves, remote.moves)) moves = remote.moves
  const resigned = local.resigned ?? remote.resigned
  if (moves === local.moves && resigned === local.resigned) return local
  return { ...local, moves, resigned }
}

/**
 * Seats are handed out by whoever already sits in the room: the first newcomer gets the free colour,
 * anyone after that watches.
 */
export function assignSeat(seats: Seats, newcomer: string): Seats {
  if (seats[newcomer]) return seats
  const taken = Object.values(seats)
  if (taken.length >= 2) return seats
  const free: Color | undefined = taken.includes('w') ? (taken.includes('b') ? undefined : 'b') : 'w'
  if (!free) return seats
  return { ...seats, [newcomer]: free }
}

export function mergeSeats(a: Seats, b: Seats): Seats {
  const out: Seats = { ...a }
  for (const [id, c] of Object.entries(b)) {
    if (out[id]) continue
    if (Object.values(out).includes(c)) continue
    out[id] = c
  }
  return out
}

export function onlineEnabled(url?: string, key?: string) {
  return !!(url && key && /^https?:\/\//.test(url))
}
