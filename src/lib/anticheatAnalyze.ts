'use client'

// Engine analysis for the anti-cheat review queue. Runs in the ADMIN's browser
// with the site's own Stockfish (a full-game search does not fit in the API
// worker's CPU budget): the admin fetches the flagged game's PGN, this samples
// the user's moves and measures how often they match the engine's choice.

import { Chess } from 'chess.js'
import type { Engine } from './engine'

export interface LocalAnalysis {
  positions: number
  match: number // 0..1
  top3: number // 0..1
  acpl: number // average centipawn loss
}

const toScore = (l: { cp?: number; mate?: number }): number =>
  l.mate !== undefined ? (l.mate > 0 ? 100000 : -100000) : (l.cp ?? 0)

export async function analyzePgnWithEngine(pgn: string, userColor: 'w' | 'b', engine: Engine, maxPositions = 12): Promise<LocalAnalysis> {
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
  const step = candidates.length > maxPositions ? candidates.length / maxPositions : 1
  const picked = candidates.filter((_, i) => i % step < 1)

  let match = 0
  let top3 = 0
  let lossSum = 0
  let done = 0
  for (const c of picked) {
    const { lines } = await engine.search(c.fen, { skill: 20, depth: 10, multipv: 3 })
    const best = lines[0]
    if (!best?.move) continue
    const bestScore = toScore(best)
    let playedScore: number
    if (c.uci === best.move) {
      playedScore = bestScore
    } else {
      const after = new Chess(c.fen)
      try {
        after.move({ from: c.uci.slice(0, 2), to: c.uci.slice(2, 4), promotion: c.uci[4] as 'q' | 'r' | 'b' | 'n' | undefined })
      } catch {
        continue
      }
      const r = await engine.search(after.fen(), { skill: 20, depth: 10 })
      playedScore = r.lines[0] ? -toScore(r.lines[0]) : bestScore
    }
    done++
    if (c.uci === best.move) match++
    if (lines.some((l) => l.move === c.uci)) top3++
    lossSum += Math.min(1000, Math.max(0, bestScore - playedScore))
  }
  return {
    positions: done,
    match: done ? match / done : 0,
    top3: done ? top3 / done : 0,
    acpl: done ? Math.round(lossSum / done) : 0,
  }
}
