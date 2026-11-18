// Trap line check: legal moves + Stockfish eval before the mistake, right after it, and at the end (pawns, trapper's point of view).
// usage: node scripts/trapcheck.mjs cands.json   cands: [{id, side, moves:[SAN], mistake}]
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { Chess } from 'chess.js'
const require = createRequire(import.meta.url)
const p = spawn(process.execPath, [require('../node_modules/stockfish/scripts/findEngine.js')()], { stdio: ['pipe', 'pipe', 'ignore'] })
const rl = createInterface({ input: p.stdout })
let waiter = null, buf = []
rl.on('line', (l) => { buf.push(l); if (waiter && l.startsWith(waiter.tok)) { const w = waiter; waiter = null; const b = buf; buf = []; w.res(b) } })
const ask = (cmd, tok) => new Promise((res) => { waiter = { tok, res }; p.stdin.write(cmd + '\n') })
await ask('uci', 'uciok'); p.stdin.write('setoption name Threads value 4\n'); await ask('isready', 'readyok')
async function ev(fen, depth = 16) {
  p.stdin.write('ucinewgame\n'); await ask('isready', 'readyok'); p.stdin.write(`position fen ${fen}\n`)
  const out = await ask(`go depth ${depth}`, 'bestmove')
  let sc = null
  for (const l of out) { const m = / score (cp|mate) (-?\d+)/.exec(l); if (m) sc = m }
  if (!sc) return 0
  const stm = fen.split(' ')[1]
  const v = sc[1] === 'mate' ? (+sc[2] > 0 ? 100 : -100) : +sc[2] / 100
  return stm === 'w' ? v : -v // white's point of view
}
for (const c of JSON.parse(readFileSync(process.argv[2], 'utf8'))) {
  const g = new Chess(); const fens = [g.fen()]
  try { for (const m of c.moves) { g.move(m); fens.push(g.fen()) } } catch (e) { console.log(c.id, 'ILLEGAL', e.message); continue }
  const sg = c.side === 'w' ? 1 : -1
  const before = sg * await ev(fens[c.mistake]), after = sg * await ev(fens[c.mistake + 1]), end = sg * await ev(fens[fens.length - 1])
  const ok = before > -1.6 && before < 2.7 && after >= 1.2 && end >= (g.isCheckmate() ? 0 : 1.9)
  console.log(`${ok ? 'OK ' : 'NO '} ${c.id} before=${before.toFixed(1)} after=${after.toFixed(1)} end=${end.toFixed(1)} mate=${g.isCheckmate()}`)
}
p.stdin.write('quit\n')
