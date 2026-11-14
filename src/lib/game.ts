// Pure helpers shared by the play pages (no React, no browser APIs), so they can be unit tested.
import { Chess } from 'chess.js'

export const PIECE_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const START_COUNT: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 }

export interface Material {
  /** pieces each side has captured (lower-case types), most valuable first */
  capturedBy: { w: string[]; b: string[] }
  /** material balance from white's point of view */
  diff: number
}

/** Counts captured pieces from the board itself (promotions count as the new piece). */
export function material(fen: string): Material {
  const board = fen.split(' ')[0]
  const count = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 } as Record<string, number>, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } as Record<string, number> }
  let score = 0
  for (const ch of board) {
    const t = ch.toLowerCase()
    if (!(t in START_COUNT)) continue
    const side = ch === t ? 'b' : 'w'
    count[side][t]++
    score += (side === 'w' ? 1 : -1) * PIECE_VALUE[t]
  }
  const missing = (side: 'w' | 'b') => {
    const out: string[] = []
    for (const t of ['q', 'r', 'b', 'n', 'p']) for (let i = count[side][t]; i < START_COUNT[t]; i++) out.push(t)
    return out
  }
  // white captured the black pieces that are missing, and the other way round
  return { capturedBy: { w: missing('b'), b: missing('w') }, diff: score }
}

/** [[1, 'e4', 'e5'], [2, 'Nf3', undefined]] */
export function movePairs(sans: string[]): [number, string, string | undefined][] {
  const out: [number, string, string | undefined][] = []
  for (let i = 0; i < sans.length; i += 2) out.push([i / 2 + 1, sans[i], sans[i + 1]])
  return out
}

/** The computer's move: usually the engine's choice, sometimes a random legal move on easy levels. */
export function pickComputerMove(fen: string, engineBest: string, randomness: number, rand: () => number = Math.random): string {
  const legal = new Chess(fen).moves({ verbose: true }).map((m) => m.from + m.to + (m.promotion ?? ''))
  if (legal.length === 0) return ''
  const valid = legal.includes(engineBest)
  if (!valid || rand() < randomness) return legal[Math.floor(rand() * legal.length)]
  return engineBest
}

/** Plays UCI moves from the start; stops at the first illegal one. */
export function playUci(moves: string[], startFen?: string) {
  const game = startFen ? new Chess(startFen) : new Chess()
  const sans: string[] = []
  const ok: string[] = []
  for (const m of moves) {
    try {
      const mv = game.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] })
      sans.push(mv.san)
      ok.push(m)
    } catch {
      break
    }
  }
  const last = ok.length ? ok[ok.length - 1] : null
  return { game, sans, moves: ok, lastMove: last ? ([last.slice(0, 2), last.slice(2, 4)] as [string, string]) : null }
}

/** Engine score as centipawns from the side to move; mates become large numbers. */
export function toCp(e: { cp?: number; mate?: number } | undefined): number {
  if (!e) return 0
  if (e.mate !== undefined) return e.mate > 0 ? 10000 - e.mate * 10 : e.mate < 0 ? -10000 - e.mate * 10 : -10000
  return e.cp ?? 0
}

export type MoveClass = 'blunder' | 'mistake' | 'inaccuracy' | 'good'

export const CLASS_NAME: Record<MoveClass, string> = {
  blunder: 'غلطة كبيرة',
  mistake: 'غلطة',
  inaccuracy: 'مش أحسن نقلة',
  good: 'كويسة',
}

/**
 * How bad a move was. before = score for the mover before the move, after = score for the mover
 * after it (both centipawns, mover's point of view). Scores are capped so a won position stays won.
 */
export function classifyMove(before: number, after: number, playedBest: boolean): { cls: MoveClass; loss: number } {
  const cap = (v: number) => Math.max(-1500, Math.min(1500, v))
  const loss = playedBest ? 0 : Math.max(0, cap(before) - cap(after))
  // still completely winning after the move: not worth flagging
  if (cap(after) >= 900 && loss < 600) return { cls: 'good', loss }
  if (loss >= 300) return { cls: 'blunder', loss }
  if (loss >= 150) return { cls: 'mistake', loss }
  if (loss >= 70) return { cls: 'inaccuracy', loss }
  return { cls: 'good', loss }
}

/** "+1.4" / "مات في 3" from white's point of view. */
export function formatEval(e: { cp?: number; mate?: number }, turn: 'w' | 'b'): string {
  const sign = turn === 'w' ? 1 : -1
  if (e.mate !== undefined) {
    const m = e.mate * sign
    return m > 0 ? `الأبيض يمات في ${Math.abs(m)}` : `الأسود يمات في ${Math.abs(m)}`
  }
  const v = ((e.cp ?? 0) * sign) / 100
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}`
}
