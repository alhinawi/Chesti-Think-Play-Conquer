import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'src/data/en'
const files = readdirSync(dir).filter((f) => /\.(json|ts)$/.test(f) && !/\.test\./.test(f))
const EMOJI = /\p{Extended_Pictographic}/u

describe('English content style', () => {
  for (const f of files) {
    const s = readFileSync(join(dir, f), 'utf8')
    it(`${f} has no emdashes`, () => {
      expect(s.includes('\u2014')).toBe(false)
    })
    it(`${f} has no emoji`, () => {
      expect(EMOJI.test(s)).toBe(false)
    })
  }
})
