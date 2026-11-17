import { describe, expect, it } from 'vitest'
import { BOTS } from '../bots'
import { WORLD3D_POSITIONS } from '../world3d'
import { BOTS_EN, W3_EN } from './bots-w3'

const AR = /[\u0600-\u06FF]/
describe('English bots and 3D positions', () => {
  it('cover every bot with Latin-only text', () => {
    for (const b of BOTS) {
      const h = BOTS_EN[b.id]
      expect(h, b.id).toBeTruthy()
      for (const k of ['tagline', 'greet', 'wins', 'loses', 'checked'] as const) {
        expect(h[k], `${b.id}.${k}`).toBeTruthy()
        expect(AR.test(h[k]), `${b.id}.${k}`).toBe(false)
      }
    }
  })
  it('cover every 3D position with Latin-only text', () => {
    for (const p of WORLD3D_POSITIONS) {
      const h = W3_EN[p.id]
      expect(h, p.id).toBeTruthy()
      expect(AR.test(h.name + h.story), p.id).toBe(false)
    }
  })
})
