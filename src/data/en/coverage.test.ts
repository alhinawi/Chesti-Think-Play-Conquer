import { describe, expect, it } from 'vitest'
import { CHAPTERS, ALL_LESSONS } from '../lessons'
import { OPENINGS } from '../openings'
import { TRAPS } from '../traps'
import { MINIATURES } from '../miniatures'
import { ENDGAMES } from '../endgames'
import { GAMES } from '../games'
import lessons from './lessons.json'
import openings from './openings.json'
import traps from './traps.json'
import endgames from './endgames.json'
import games from './games.json'

const AR = /[\u0600-\u06FF]/

/** Every string leaf of a JSON value, with its path, so a failure names the exact entry. */
function leaves(v: unknown, path = ''): [string, string][] {
  if (typeof v === 'string') return [[path, v]]
  if (Array.isArray(v)) return v.flatMap((x, i) => leaves(x, `${path}[${i}]`))
  if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => leaves(x, `${path}.${k}`))
  return []
}

describe('English content dictionaries', () => {
  it.each([
    ['lessons', lessons],
    ['openings', openings],
    ['traps and miniatures', traps],
    ['endgames', endgames],
    ['games', games],
  ] as const)('%s contain no Arabic text and no empty strings', (_n, dict) => {
    for (const [p, s] of leaves(dict)) {
      expect(AR.test(s), p).toBe(false)
      expect(s.trim().length, p).toBeGreaterThan(0)
    }
  })

  it('cover every id of the Arabic source data', () => {
    const miss = (ids: string[], d: Record<string, unknown>) => ids.filter((id) => !(id in d))
    expect(miss(OPENINGS.map((o) => o.id), openings)).toEqual([])
    expect(miss([...TRAPS, ...MINIATURES].map((t) => t.id), traps)).toEqual([])
    expect(miss(ENDGAMES.map((e) => e.id), endgames)).toEqual([])
    expect(miss(GAMES.map((g) => g.id), games)).toEqual([])
    const l = lessons as { chapters: Record<string, unknown>; lessons: Record<string, unknown> }
    expect(miss(CHAPTERS.map((c) => c.id), l.chapters)).toEqual([])
    expect(miss(ALL_LESSONS.map((x) => x.id), l.lessons)).toEqual([])
  })
})
