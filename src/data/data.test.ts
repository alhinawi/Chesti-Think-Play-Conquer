import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { CHAPTERS } from './lessons'
import { TRAPS } from './traps'
import { PUZZLES } from './puzzles'
import { ARTICLES, CATEGORIES, TERMS } from './encyclopedia'
import { OPENINGS } from './openings'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const UCI = /^[a-h][1-8][a-h][1-8][qrbn]?$/

function validFen(fen: string) {
  expect(() => new Chess(fen)).not.toThrow()
}

function playSan(fen: string, moves: string[]) {
  const g = new Chess(fen)
  for (const m of moves) expect(() => g.move(m), `move ${m} from ${g.fen()}`).not.toThrow()
  return g
}

function uniq(ids: string[]) {
  expect(new Set(ids).size).toBe(ids.length)
}

describe('lessons', () => {
  it('have unique ids', () => {
    uniq(CHAPTERS.map((c) => c.id))
    uniq(CHAPTERS.flatMap((c) => c.lessons.map((l) => l.id)))
  })
  for (const ch of CHAPTERS)
    for (const lesson of ch.lessons)
      it(`${ch.id}/${lesson.id}: every step is legal`, () => {
        expect(lesson.steps.length).toBeGreaterThan(0)
        for (const step of lesson.steps) {
          if (step.kind === 'explain') {
            if (step.fen) validFen(step.fen)
          } else if (step.kind === 'line') {
            playSan(step.fen ?? START, step.moves)
          } else {
            validFen(step.fen)
            // Follow the first option of each ply; every option must be legal.
            const g = new Chess(step.fen)
            for (const ply of step.solution) {
              const options = ply.split('|')
              for (const o of options) {
                expect(o, `uci ${o}`).toMatch(UCI)
                const probe = new Chess(g.fen())
                expect(() => probe.move({ from: o.slice(0, 2), to: o.slice(2, 4), promotion: o[4] }), `${lesson.id}: ${o} in ${g.fen()}`).not.toThrow()
              }
              const o = options[0]
              g.move({ from: o.slice(0, 2), to: o.slice(2, 4), promotion: o[4] })
            }
            if (step.goal === 'mate' && step.solution.length) expect(g.isCheckmate(), `${lesson.id} ends in mate`).toBe(true)
          }
        }
      })
})

describe('traps', () => {
  it('have unique ids', () => uniq(TRAPS.map((t) => t.id)))
  for (const t of TRAPS)
    it(`${t.id}: line is legal and notes line up`, () => {
      playSan(START, t.moves)
      expect(t.notes.length).toBe(t.moves.length)
      expect(t.mistake).toBeGreaterThanOrEqual(0)
      expect(t.mistake).toBeLessThan(t.moves.length)
      // the mistake is made by the side that falls into the trap
      const mistakeSide = t.mistake % 2 === 0 ? 'w' : 'b'
      expect(mistakeSide).not.toBe(t.side)
    })
  it('lines that end with # are mate', () => {
    for (const t of TRAPS)
      if (t.moves[t.moves.length - 1].endsWith('#')) expect(playSan(START, t.moves).isCheckmate(), t.id).toBe(true)
  })
})

describe('openings', () => {
  it('have unique ids', () => uniq(OPENINGS.map((o) => o.id)))
  for (const o of OPENINGS)
    it(`${o.id}: line is legal and notes are in range`, () => {
      expect(o.moves.length).toBeGreaterThan(3)
      playSan(START, o.moves)
      for (const k of Object.keys(o.notes)) {
        const i = Number(k)
        expect(i).toBeGreaterThanOrEqual(0)
        expect(i).toBeLessThan(o.moves.length)
        expect(o.notes[i].trim().length).toBeGreaterThan(0)
      }
      expect(o.planW.trim().length).toBeGreaterThan(0)
      expect(o.planB.trim().length).toBeGreaterThan(0)
    })
})

describe('puzzles', () => {
  it('have unique ids', () => uniq(PUZZLES.map((p) => p.id)))
  for (const p of PUZZLES)
    it(`${p.id}: solution is legal`, () => {
      const g = new Chess(p.fen)
      expect(p.solution.length % 2).toBe(1) // ends on the solver's move
      for (const m of p.solution) {
        expect(m).toMatch(UCI)
        expect(() => g.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] }), `${p.id}: ${m}`).not.toThrow()
      }
      if (/مات/.test(p.theme)) expect(g.isCheckmate(), `${p.id} ends in mate`).toBe(true)
    })
})

describe('encyclopedia', () => {
  it('has unique ids and known categories', () => {
    uniq(ARTICLES.map((a) => a.id))
    const cats = new Set(CATEGORIES.map((c) => c.id))
    for (const a of ARTICLES) expect(cats.has(a.category), a.id).toBe(true)
    uniq(TERMS.map((t) => t.term))
  })
  for (const a of ARTICLES)
    it(`${a.id}: boards and lines are legal`, () => {
      for (const b of a.blocks) {
        if ('board' in b) validFen(b.board.fen)
        if ('line' in b) playSan(b.line.fen ?? START, b.line.moves)
      }
    })
})
