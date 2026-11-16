// Anti-cheat risk scoring. Combines client-reported timing/environment signals
// with server-side facts (result, duration, recent history) into a 0-100 risk
// score per recorded game. This is a REVIEW indicator, not a verdict: every
// signal has honest false positives (slow devices, a focused beginner, someone
// replaying their own analysis), so a high score only queues the game for an
// admin to look at. Soft actions only - flag, exclude from leaderboard - and
// never automatic.

export interface Telemetry {
  move_times?: number[] // ms per user move
  signals?: {
    blurs?: number // tab/app lost focus mid-game
    pastes?: number // paste events mid-game
    focus_losses?: number // window focus losses mid-game
    level?: number // computer level 1-8, when mode is computer
  }
}

export interface ScoreInput {
  telemetry: Telemetry | null
  result: 'win' | 'loss' | 'draw'
  moves: number // total plies in the game
  durationSeconds: number | null
  recentWins: number // wins in the user's last 10 games before this one
  recentGames: number
}

export interface RiskVerdict {
  score: number
  reasons: string[]
}

export const FLAG_THRESHOLD = 50

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

export function scoreGame(input: ScoreInput): RiskVerdict {
  const reasons: string[] = []
  let score = 0

  const times = (input.telemetry?.move_times ?? []).filter((t) => Number.isFinite(t) && t >= 0)
  const sig = input.telemetry?.signals

  // Skip the first 4 user moves: openings are played fast by everyone.
  const mid = times.slice(4)

  if (mid.length >= 10) {
    const fast = mid.filter((t) => t < 700).length / mid.length
    if (fast >= 0.6) {
      score += 35
      reasons.push('impossibly_fast')
    }
    const m = mean(mid)
    if (m > 0) {
      const sd = Math.sqrt(mean(mid.map((t) => (t - m) ** 2)))
      if (sd / m < 0.15) {
        score += 25
        reasons.push('robotic_timing')
      }
    }
    if (input.result === 'win' && mid.length >= 15 && Math.max(...mid) < 3000) {
      score += 15
      reasons.push('no_think_time')
    }
  } else if (times.length === 0) {
    // No timing data at all: weak signal on its own (old clients send none).
    score += 5
    reasons.push('no_timing_data')
  }

  if ((sig?.blurs ?? 0) >= 5) {
    score += 30
    reasons.push('tab_switching')
  } else if ((sig?.blurs ?? 0) >= 2) {
    score += 20
    reasons.push('tab_switching')
  }
  if ((sig?.pastes ?? 0) >= 1) {
    score += 25
    reasons.push('paste_detected')
  }

  if (input.moves >= 30 && input.durationSeconds !== null && input.durationSeconds < 60) {
    score += 25
    reasons.push('short_game_many_moves')
  }

  if (input.result === 'win' && input.recentGames >= 10 && input.recentWins >= 10) {
    score += 20
    reasons.push('perfect_streak')
  }

  return { score: Math.min(100, score), reasons }
}

// Bump applied after an on-demand engine analysis from the review queue.
export function engineBump(analysis: { positions: number; match: number; acpl: number }): { bump: number; reasons: string[] } {
  if (analysis.positions < 10) return { bump: 0, reasons: [] }
  const reasons: string[] = []
  let bump = 0
  if (analysis.match >= 0.8) {
    bump += 35
    reasons.push('engine_like_moves')
  }
  if (analysis.acpl <= 20) {
    bump += 20
    reasons.push('low_acpl')
  }
  return { bump, reasons }
}

/** Validate the telemetry blob that arrives with a recorded game. */
export function cleanTelemetry(v: unknown): Telemetry | null {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null
  const t = v as Record<string, unknown>
  const out: Telemetry = {}
  if (Array.isArray(t.move_times)) {
    const times = t.move_times.slice(0, 400)
    if (times.some((x) => typeof x !== 'number' || !Number.isFinite(x) || x < 0 || x > 600_000)) return null
    out.move_times = times.map((x) => Math.round(x as number))
  }
  if (typeof t.signals === 'object' && t.signals !== null && !Array.isArray(t.signals)) {
    const s = t.signals as Record<string, unknown>
    const num = (k: string, max: number) => {
      const x = s[k]
      return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= max ? x : undefined
    }
    out.signals = {
      blurs: num('blurs', 1000),
      pastes: num('pastes', 1000),
      focus_losses: num('focus_losses', 1000),
      level: num('level', 8),
    }
  }
  return out
}
