import { describe, expect, it } from 'vitest'
import { classifyMove, formatEval, material, movePairs, pickComputerMove, playUci, toCp } from './game'
import { coachLine } from './coach'
import { BOTS } from '../data/bots'
import { LEVELS } from './engine'
import { ACHIEVEMENTS, bestStreakOf, dailyIndex, rankOf, RANKS, streakOf, XP, xpOf } from './rank'
import { assignSeat, makeRoomCode, mergeGame, mergeSeats, newGame, normalizeRoomCode, onlineEnabled } from './online'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

describe('material', () => {
  it('is level at the start', () => {
    expect(material(START)).toEqual({ capturedBy: { w: [], b: [] }, diff: 0 })
  })
  it('counts a captured knight for white', () => {
    const { game } = playUci(['e2e4', 'g8f6', 'e4e5', 'f6d5', 'c2c4', 'd5b4', 'd2d3', 'b4c2', 'd1c2'])
    const m = material(game.fen())
    expect(m.capturedBy.w).toEqual(['n'])
    expect(m.diff).toBe(3)
  })
})

describe('movePairs', () => {
  it('groups moves by number', () => {
    expect(movePairs(['e4', 'e5', 'Nf3'])).toEqual([
      [1, 'e4', 'e5'],
      [2, 'Nf3', undefined],
    ])
  })
})

describe('pickComputerMove', () => {
  it('keeps the engine move when there is no randomness', () => {
    expect(pickComputerMove(START, 'e2e4', 0, () => 0.99)).toBe('e2e4')
  })
  it('falls back to a legal move when the engine move is not legal', () => {
    const m = pickComputerMove(START, 'e2e5', 0, () => 0)
    expect(playUci([m]).moves).toEqual([m])
  })
  it('returns nothing when there are no legal moves', () => {
    expect(pickComputerMove('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', '', 0)).toBe('')
  })
})

describe('playUci', () => {
  it('stops at the first illegal move', () => {
    const r = playUci(['e2e4', 'e7e5', 'e4e5', 'g1f3'])
    expect(r.moves).toEqual(['e2e4', 'e7e5'])
    expect(r.sans).toEqual(['e4', 'e5'])
    expect(r.lastMove).toEqual(['e7', 'e5'])
  })
  it('handles promotion', () => {
    const r = playUci(['a7a8q'], '8/P7/8/8/8/8/8/k6K w - - 0 1')
    expect(r.sans).toEqual(['a8=Q+'])
  })
})

describe('formatEval', () => {
  it('shows white-relative scores', () => {
    expect(formatEval({ cp: 140 }, 'w')).toBe('+1.4')
    expect(formatEval({ cp: 140 }, 'b')).toBe('-1.4')
    expect(formatEval({ mate: 2 }, 'b')).toBe('الأسود يمات في 2')
  })
})

describe('analysis', () => {
  it('turns mates into big scores', () => {
    expect(toCp({ mate: 1 })).toBeGreaterThan(9000)
    expect(toCp({ mate: -2 })).toBeLessThan(-9000)
    expect(toCp({ cp: 35 })).toBe(35)
  })
  it('classifies by how much was lost', () => {
    expect(classifyMove(50, -400, false).cls).toBe('blunder')
    expect(classifyMove(50, -120, false).cls).toBe('mistake')
    expect(classifyMove(50, -30, false).cls).toBe('inaccuracy')
    expect(classifyMove(50, 40, false).cls).toBe('good')
    expect(classifyMove(50, -400, true).cls).toBe('good')
  })
  it('does not flag a move that keeps a won game won', () => {
    expect(classifyMove(9990, 1200, false).cls).toBe('good')
    expect(classifyMove(9990, -200, false).cls).toBe('blunder')
  })
})

describe('coach and bots', () => {
  const base = { san: 'Nf3', piece: 'n', flags: 'n', mate: false, check: false, moveNo: 5 }
  const first = () => 0
  it('comments on the moves that matter', () => {
    expect(coachLine({ ...base, mate: true, check: true }, first)).toContain('مات')
    expect(coachLine({ ...base, san: 'O-O', piece: 'k', flags: 'k' }, first)).toContain('بيّت')
    expect(coachLine({ ...base, captured: 'q', flags: 'c' }, first)).toBeTruthy()
    expect(coachLine({ ...base, san: 'e4', piece: 'p', moveNo: 1 }, first)).toBeTruthy()
    expect(coachLine(base, first)).toBeNull()
  })
  it('has one bot for every engine level', () => {
    expect(BOTS.map((b) => b.level).sort()).toEqual(LEVELS.map((l) => l.id).sort())
    expect(new Set(BOTS.map((b) => b.id)).size).toBe(BOTS.length)
  })
})

describe('ranks and streaks', () => {
  const p = { lessons: ['a', 'b'], puzzles: ['x'], traps: [], openings: [], wins: { mido: 2 }, daily: ['2026-11-13'], days: [], games: 3 }
  it('adds up XP', () => {
    expect(xpOf(p)).toBe(2 * XP.lesson + XP.puzzle + XP.daily + 3 * XP.game + 2 * XP.win)
  })
  it('finds the rank and the progress to the next one', () => {
    expect(rankOf(0).name).toBe(RANKS[0].name)
    const r = rankOf(275)
    expect(r.name).toBe(RANKS[1].name)
    expect(r.pct).toBe(50)
    expect(rankOf(999999).next).toBeUndefined()
  })
  it('counts streaks across months', () => {
    expect(streakOf(['2026-10-30', '2026-10-31', '2026-11-01'], '2026-11-01')).toBe(3)
    expect(streakOf(['2026-10-31', '2026-11-01'], '2026-11-02')).toBe(2)
    expect(streakOf(['2026-10-30'], '2026-11-02')).toBe(0)
    expect(bestStreakOf(['2026-01-01', '2026-01-02', '2026-01-05', '2026-01-06', '2026-01-07'])).toBe(3)
  })
  it('picks a stable daily puzzle', () => {
    expect(dailyIndex('2026-11-14', 50)).toBe(dailyIndex('2026-11-14', 50))
    const seen = new Set(Array.from({ length: 30 }, (_, i) => dailyIndex(`2026-12-${String(i + 1).padStart(2, '0')}`, 50)))
    expect(seen.size).toBeGreaterThan(15)
  })
  it('unlocks achievements', () => {
    const t = { lessons: 10, traps: 5, puzzles: 50, openings: 12 }
    const got = ACHIEVEMENTS.filter((a) => a.test(p, t)).map((a) => a.id)
    expect(got).toEqual(expect.arrayContaining(['first-lesson', 'first-puzzle', 'first-win', 'beat-metwally'].filter((x) => x !== 'beat-metwally')))
    expect(got).not.toContain('beat-metwally')
  })
})

describe('online rooms', () => {
  it('makes readable codes', () => {
    const c = makeRoomCode()
    expect(c).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
    expect(normalizeRoomCode(` ${c.toLowerCase()} `)).toBe(c)
    expect(normalizeRoomCode('ab')).toBeNull()
    expect(normalizeRoomCode(null)).toBeNull()
  })

  it('keeps the longer copy of the same game', () => {
    const g = { ...newGame(), moves: ['e2e4'] }
    const longer = { ...g, moves: ['e2e4', 'e7e5'] }
    expect(mergeGame(g, longer).moves).toEqual(['e2e4', 'e7e5'])
    expect(mergeGame(longer, g).moves).toEqual(['e2e4', 'e7e5'])
  })

  it('ignores a copy that went a different way', () => {
    const g = { ...newGame(), moves: ['e2e4', 'e7e5'] }
    expect(mergeGame(g, { ...g, moves: ['d2d4', 'd7d5', 'c2c4'] })).toBe(g)
  })

  it('prefers the newer game after a rematch', () => {
    const old = { ...newGame(Math.random, 1000), moves: ['e2e4'] }
    const fresh = newGame(Math.random, 2000)
    expect(mergeGame(old, fresh)).toBe(fresh)
    expect(mergeGame(fresh, old)).toBe(fresh)
  })

  it('carries a resignation over', () => {
    const g = newGame()
    expect(mergeGame(g, { ...g, resigned: 'b' }).resigned).toBe('b')
  })

  it('gives the free colour to the first newcomer only', () => {
    let seats = { host: 'b' as const } as Record<string, 'w' | 'b'>
    seats = assignSeat(seats, 'guest')
    expect(seats).toEqual({ host: 'b', guest: 'w' })
    expect(assignSeat(seats, 'third')).toEqual(seats)
    expect(assignSeat(seats, 'guest')).toBe(seats)
  })

  it('merges seats without giving one colour twice', () => {
    expect(mergeSeats({ a: 'w' }, { b: 'b', c: 'w' })).toEqual({ a: 'w', b: 'b' })
  })

  it('knows when online play is configured', () => {
    expect(onlineEnabled('', '')).toBe(false)
    expect(onlineEnabled('https://x.supabase.co', 'key')).toBe(true)
  })
})
