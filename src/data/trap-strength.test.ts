import { describe, expect, it } from 'vitest'
import { TRAPS } from './traps'
import { TRAP_STRENGTH } from './trap-strength'
import verified from './trap-verified.json'
import audit from './trap-audit.json'

const A = audit as unknown as Record<string, { mateAtEnd?: boolean }>

const V = verified as Record<string, { end: number; mate: boolean }>

describe('trap strength', () => {
  it('every trap whose verified line ends in forced mate is tagged checkmate', () => {
    for (const t of TRAPS) {
      const v = V[t.id]
      if (v.mate || v.end >= 99) expect(TRAP_STRENGTH[t.id].mate, t.id).toBe(true)
    }
  })
  it('the Fishing Pole trap is a checkmate trap', () => {
    expect(TRAP_STRENGTH['fishing-pole'].mate).toBe(true)
  })
  it('every trap has an engine audit entry and audit-confirmed mates are tagged', () => {
    for (const t of TRAPS) {
      expect(A[t.id], t.id).toBeTruthy()
      if (A[t.id].mateAtEnd) expect(TRAP_STRENGTH[t.id].mate, t.id).toBe(true)
    }
  })
  it('trap ids are unique', () => {
    expect(new Set(TRAPS.map((t) => t.id)).size).toBe(TRAPS.length)
  })
})
