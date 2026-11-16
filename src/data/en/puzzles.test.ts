import { describe, expect, it } from 'vitest'
import { PUZZLES } from '../puzzles'
import { PUZZLES_EN } from './puzzles'

const spans = (s: string) => (s.match(/`[^`]*`/g) ?? []).join('|')

describe('English puzzle text', () => {
  it('only references real puzzles, with no Arabic and the same move notation', () => {
    for (const [id, [name, text, explain]] of Object.entries(PUZZLES_EN)) {
      const p = PUZZLES.find((x) => x.id === id)
      expect(p, id).toBeTruthy()
      expect(`${name}${text}${explain}`, id).not.toMatch(/[\u0600-\u06FF]/)
      expect(spans(explain), `${id} explain`).toBe(spans(p!.explain))
    }
  })
})
