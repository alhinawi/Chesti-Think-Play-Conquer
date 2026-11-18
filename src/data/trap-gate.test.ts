import { describe, expect, it } from 'vitest'
import verified from './trap-verified.json'
import { trapProblems, trapSig, type TrapVerdict } from './trap-gate'
import { TRAPS } from './traps'

const V = verified as Record<string, TrapVerdict>

// A trap cannot ship unless the engine gate (scripts/trapverify.mts) has verified this exact line.
describe('trap engine gate', () => {
  it('every trap has a verdict for its exact line', () => {
    const missing = TRAPS.filter((t) => !V[t.id] || V[t.id].sig !== trapSig(t)).map((t) => t.id)
    expect(missing, 'run: npx tsx scripts/trapverify.mts (unverified or edited traps)').toEqual([])
  })
  it('every verdict meets the trap criteria', () => {
    const bad = TRAPS.filter((t) => V[t.id] && trapProblems(V[t.id]).length > 0).map((t) => t.id)
    expect(bad).toEqual([])
  })
  it('no verdict is kept for a trap that no longer exists', () => {
    const ids = new Set(TRAPS.map((t) => t.id))
    expect(Object.keys(V).filter((id) => !ids.has(id))).toEqual([])
  })
})
