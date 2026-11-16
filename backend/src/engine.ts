// Tiny self-contained analyzer used by the anti-cheat review flow.
// NOT a strong engine: a depth-2 alpha-beta search with quiescence and a hard
// node cap, tuned to answer one question cheaply - "does this move match what a
// straightforward engine would play here?" It powers the engine-match rate and
// average centipawn loss signals. Runs on-demand from the admin queue only,
// never on the user's game-submit path.

import { Chess, type Move } from 'chess.js'

const VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }

// Piece-square tables, a8..h1 order (matches Chess.board(): rank 8 first).
const PST: Record<string, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, 10, 10, 10, 10, 5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20,
  ],
}

const NODE_CAP = 6000

type Board = ReturnType<Chess['board']>

// Static eval in centipawns, from White's perspective.
function evaluate(board: Board): number {
  let score = 0
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = board[r][f]
      if (!sq) continue
      const idx = sq.color === 'w' ? r * 8 + f : (7 - r) * 8 + f
      const v = VALUE[sq.type] + PST[sq.type][idx]
      score += sq.color === 'w' ? v : -v
    }
  }
  return score
}

const uci = (m: Move) => m.from + m.to + (m.promotion ?? '')

// Captures first (MVV-LVA), then the rest - makes alpha-beta cut early.
function ordered(g: Chess): Move[] {
  const moves = g.moves({ verbose: true })
  moves.sort((a, b) => {
    const ca = a.captured ? VALUE[a.captured] * 10 - VALUE[a.piece] : 0
    const cb = b.captured ? VALUE[b.captured] * 10 - VALUE[b.piece] : 0
    return cb - ca
  })
  return moves
}

function quiesce(g: Chess, alpha: number, beta: number, sign: number, ctx: { nodes: number }, q: number): number {
  ctx.nodes++
  const stand = sign * evaluate(g.board())
  if (stand >= beta) return beta
  if (stand > alpha) alpha = stand
  if (q <= 0 || ctx.nodes >= NODE_CAP) return alpha
  for (const m of ordered(g)) {
    if (!m.captured && !m.promotion) continue
    g.move(m)
    const s = -quiesce(g, -beta, -alpha, -sign, ctx, q - 1)
    g.undo()
    if (s >= beta) return beta
    if (s > alpha) alpha = s
    if (ctx.nodes >= NODE_CAP) break
  }
  return alpha
}

function search(g: Chess, depth: number, alpha: number, beta: number, sign: number, ctx: { nodes: number }): number {
  if (ctx.nodes >= NODE_CAP) return sign * evaluate(g.board())
  const moves = ordered(g)
  if (moves.length === 0) return g.inCheck() ? -100000 + (2 - depth) : 0
  if (depth === 0) return quiesce(g, alpha, beta, sign, ctx, 4)
  let best = -Infinity
  for (const m of moves) {
    g.move(m)
    const s = -search(g, depth - 1, -beta, -alpha, -sign, ctx)
    g.undo()
    if (s > best) best = s
    if (s > alpha) alpha = s
    if (alpha >= beta) break
  }
  return best
}

export interface PositionAnalysis {
  best: string
  top3: string[]
  scores: Map<string, number> // uci -> score from side-to-move perspective
}

// Score every legal root move of a position (depth-2 search).
export function analyzePosition(fen: string): PositionAnalysis {
  const g = new Chess(fen)
  const sign = g.turn() === 'w' ? 1 : -1
  const ctx = { nodes: 0 }
  const scores = new Map<string, number>()
  for (const m of ordered(g)) {
    g.move(m)
    scores.set(uci(m), -search(g, 1, -Infinity, Infinity, -sign, ctx))
    g.undo()
  }
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1])
  return { best: ranked[0]?.[0] ?? '', top3: ranked.slice(0, 3).map(([u]) => u), scores }
}

export interface GameAnalysis {
  positions: number
  match: number // share of sampled user moves equal to the analyzer's best
  top3: number // share inside the analyzer's top 3
  acpl: number // average centipawn loss, capped at 1000 per move
}

/**
 * Engine-match analysis for one recorded game. Steps through the PGN once and
 * analyzes the user's moves, skipping the first 8 plies (openings match by
 * convention, not by engine use) and positions with a single legal move.
 * Samples evenly down to `maxPositions` positions in long games.
 */
export function analyzeGame(pgn: string, userColor: 'w' | 'b', maxPositions = 24): GameAnalysis {
  const replay = new Chess()
  replay.loadPgn(pgn)
  const history = replay.history({ verbose: true })

  const g = new Chess()
  const candidates: { fen: string; uci: string }[] = []
  history.forEach((m, i) => {
    if (m.color === userColor && i >= 8 && g.moves().length > 1) {
      candidates.push({ fen: g.fen(), uci: m.from + m.to + (m.promotion ?? '') })
    }
    g.move(m)
  })
  // Even sample when the game is long.
  const step = candidates.length > maxPositions ? candidates.length / maxPositions : 1
  const picked = candidates.filter((_, i) => i % step < 1)

  let match = 0
  let top3 = 0
  let lossSum = 0
  let done = 0
  for (const c of picked) {
    const a = analyzePosition(c.fen)
    if (!a.best) continue
    const playedScore = a.scores.get(c.uci)
    if (playedScore === undefined) continue
    done++
    if (c.uci === a.best) match++
    if (a.top3.includes(c.uci)) top3++
    const bestScore = a.scores.get(a.best)!
    lossSum += Math.min(1000, Math.max(0, bestScore - playedScore))
  }
  return {
    positions: done,
    match: done ? match / done : 0,
    top3: done ? top3 / done : 0,
    acpl: done ? Math.round(lossSum / done) : 0,
  }
}
