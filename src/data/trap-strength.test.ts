import { describe, expect, it } from 'vitest'
import { TRAPS } from './traps'
import { TRAP_STRENGTH } from './trap-strength'
import verified from './trap-verified.json'

const V = verified as Record<string, { end: number; mate: boolean }>

describe('trap strength', () => {
  it('every trap whose verified line ends in forced mate is tagged checkmate', () => {
    for (const t of TRAPS) {
      const v = V[t.id]
      if (v.mate || v.end >= 99) expect(TRAP_STRENGTH[t.id].mate, t.id).toBe(true)
    }
  })
  it('the Fishing Pole and Smyslov traps are checkmate traps', () => {
    expect(TRAP_STRENGTH['fishing-pole'].mate).toBe(true)
    expect(TRAP_STRENGTH['smyslov-caro-trap'].mate).toBe(true)
  })
})
