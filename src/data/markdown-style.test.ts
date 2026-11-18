import { describe, expect, it } from 'vitest'
import { ALL_LESSONS } from './lessons'
import enLessons from './en/lessons.json'

const nested = (t: string) => [...t.matchAll(/\*\*([^*]+)\*\*/g)].some((m) => m[1].includes('`'))

function texts(): [string, string][] {
  const out: [string, string][] = []
  for (const l of ALL_LESSONS) for (const [i, s] of l.steps.entries()) if ('text' in s && s.text) out.push([`ar ${l.id}#${i}`, s.text])
  for (const [id, l] of Object.entries(enLessons.lessons as Record<string, { steps: { text?: string }[] }>))
    for (const [i, s] of l.steps.entries()) if (s.text) out.push([`en ${id}#${i}`, s.text])
  return out
}

describe('lesson markdown', () => {
  it('never nests backticks inside bold (renders as literal backticks)', () => {
    expect(texts().filter(([, t]) => nested(t)).map(([k]) => k)).toEqual([])
  })
})
