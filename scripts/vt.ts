import { Chess } from 'chess.js'
import { TRAPS } from '../src/data/traps'
for (const t of TRAPS) {
  const g = new Chess()
  let ok = true
  t.moves.forEach((m, i) => { try { g.move(m) } catch { console.log('ILLEGAL', t.id, i, m, g.fen()); ok = false } })
  if (t.notes.length !== t.moves.length) console.log('NOTES LEN', t.id, t.notes.length, t.moves.length)
  const mistakeSide = t.mistake % 2 === 0 ? 'w' : 'b'
  if (mistakeSide === t.side) console.log('MISTAKE SIDE WRONG', t.id)
  console.log(ok ? 'ok' : 'BAD', t.id, g.isCheckmate() ? 'MATE' : '', g.fen())
}
