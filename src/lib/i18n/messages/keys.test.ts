import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import eg from './eg'

function walk(d: string, out: string[] = []): string[] {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.tsx?$/.test(f) && !/\.test\./.test(f)) out.push(p)
  }
  return out
}

function has(o: unknown, path: string): boolean {
  let cur: unknown = o
  for (const k of path.split('.')) {
    if (cur && typeof cur === 'object' && k in (cur as object)) cur = (cur as Record<string, unknown>)[k]
    else return false
  }
  return typeof cur === 'string'
}

describe('t() keys used in source', () => {
  it('all literal keys exist in the Egyptian catalog', () => {
    const missing = new Set<string>()
    for (const f of walk('src')) {
      const s = readFileSync(f, 'utf8')
      for (const m of s.matchAll(/\bt2?\(\s*'([a-zA-Z0-9]+\.[a-zA-Z0-9.]+)'/g)) {
        if (!has(eg, m[1])) missing.add(`${f}: ${m[1]}`)
      }
    }
    expect([...missing]).toEqual([])
  })
})
