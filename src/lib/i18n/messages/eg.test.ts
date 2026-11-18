import { describe, expect, it } from 'vitest'
import eg from './eg'

function strings(o: unknown, p = ''): [string, string][] {
  const out: [string, string][] = []
  for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
    if (v && typeof v === 'object') out.push(...strings(v, `${p}${k}.`))
    else out.push([`${p}${k}`, String(v)])
  }
  return out
}

describe('Egyptian UI catalog style', () => {
  const all = strings(eg)
  it('uses English digits only', () => {
    expect(all.filter(([, v]) => /[\u0660-\u0669\u06F0-\u06F9]/.test(v)).map(([k]) => k)).toEqual([])
  })
  it('has no emoji', () => {
    expect(all.filter(([, v]) => /\p{Emoji_Presentation}/u.test(v)).map(([k]) => k)).toEqual([])
  })
  it('has no empty strings', () => {
    expect(all.filter(([, v]) => v.trim() === '').map(([k]) => k)).toEqual([])
  })
})
