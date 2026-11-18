import { describe, expect, it } from 'vitest'
import eg from './eg'
import en from './en'

const AR = /[\u0600-\u06FF]/

function flat(o: unknown, p = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
    if (v && typeof v === 'object') Object.assign(out, flat(v, `${p}${k}.`))
    else out[`${p}${k}`] = String(v)
  }
  return out
}

describe('English UI catalog', () => {
  const a = flat(eg)
  const b = flat(en)
  it('has the same keys as the Egyptian catalog', () => {
    expect(Object.keys(b).sort()).toEqual(Object.keys(a).sort())
  })
  it('has no Arabic text', () => {
    const bad = Object.entries(b).filter(([, v]) => AR.test(v)).map(([k]) => k)
    expect(bad).toEqual([])
  })
})
