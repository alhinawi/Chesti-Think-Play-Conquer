import { describe, expect, it } from 'vitest'
import { ARTICLES, CATEGORIES, TERMS } from '../encyclopedia'
import en from './encyclopedia.json'

const AR = /[\u0600-\u06FF]/
const d = en as Record<string, any>

describe('English encyclopedia has no Arabic', () => {
  it('every article leaf resolves via the runtime key format and is Latin', () => {
    for (const a of ARTICLES) {
      const h = d[a.id] as Record<string, string>
      expect(h, a.id).toBeTruthy()
      const keys: unknown[] = ['title', 'summary', ...(a.tags ?? []).map((_, i) => ['tag', i])]
      a.blocks.forEach((b: any, i) => {
        if ('h' in b) keys.push([i, 'h'])
        else if ('p' in b) keys.push([i, 'p'])
        else if ('list' in b) b.list.forEach((_: string, j: number) => keys.push([i, 'l', j]))
        else if ('board' in b) keys.push([i, 'bc'])
        else if ('line' in b) keys.push([i, 'lc'])
      })
      for (const k of keys) {
        const v = h[JSON.stringify(k)]
        expect(v, `${a.id} ${JSON.stringify(k)}`).toBeTruthy()
        expect(AR.test(v), `${a.id} ${JSON.stringify(k)}`).toBe(false)
      }
    }
  })
  it('categories and terms are English', () => {
    for (const c of CATEGORIES) {
      const v = d._cats[c.id]
      expect(AR.test(v[0] + v[1]), c.id).toBe(false)
    }
    TERMS.forEach((_, i) => expect(AR.test(d._terms[i] ?? '\u0627'), String(i)).toBe(false))
  })
})
