import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// UI strings are rendered as plain text (not RichText), so a backtick would show up literally.
describe('UI message catalogs', () => {
  it('contain no literal backticks', () => {
    const dir = __dirname
    const files = readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && f !== 'index.ts')
    const bad = files.filter((f) => readFileSync(join(dir, f), 'utf8').includes('`'))
    expect(bad).toEqual([])
  })
})
