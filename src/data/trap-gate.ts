import { createHash } from 'node:crypto'
import type { Trap } from './types'

/** evals are in pawns from the TRAPPER's point of view (Stockfish depth 16, scripts/trapverify.mts) */
export type TrapVerdict = { sig: string; before: number; after: number; end: number; mate: boolean }

/** one signature per exact line, so editing a line without re-verifying fails the gate */
export const trapSig = (t: Pick<Trap, 'side' | 'moves' | 'mistake'>) =>
  createHash('sha1').update(`${t.side}|${t.mistake}|${t.moves.join(' ')}`).digest('hex').slice(0, 16)

/**
 * A trap is real when the position before the victim's move is not already won for the trapper,
 * and the line really ends with mate or a clear engine edge that the victim's move caused.
 */
export function trapProblems(v: TrapVerdict): string[] {
  const p: string[] = []
  if (v.before > 2.7) p.push('trapper already winning before the mistake')
  if (!v.mate && v.end < 1.9) p.push('no clear gain at the end of the line')
  if (v.end - v.before < 1.5) p.push('the victim move did not change the evaluation enough')
  return p
}
