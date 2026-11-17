import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS, RANKS } from '../../lib/rank'
import { ACH_EN, RANK_EN } from './ui-misc'

const AR = /[\u0600-\u06FF]/
describe('English ranks and achievements', () => {
  it('cover every rank and achievement, Latin only', () => {
    for (const r of RANKS) expect(AR.test(RANK_EN[r.name] ?? '\u0627'), r.name).toBe(false)
    for (const a of ACHIEVEMENTS) {
      const h = ACH_EN[a.id]
      expect(h, a.id).toBeTruthy()
      expect(AR.test(h[0] + h[1]), a.id).toBe(false)
    }
  })
})
