// Mines engine-verified opening traps from the ECO book: at the end of each named line, a tempting move (capture or check)
// by the side to move that Stockfish says loses material by force. usage: node scripts/trapmine.mjs START END OUT.jsonl
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { readFileSync, appendFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { Chess } from 'chess.js'
const require = createRequire(import.meta.url)
const p = spawn(process.execPath, [require('../node_modules/stockfish/scripts/findEngine.js')()], { stdio: ['pipe', 'pipe', 'ignore'] })
const rl = createInterface({ input: p.stdout })
let waiter = null, buf = []
rl.on('line', (l) => { buf.push(l); if (waiter && l.startsWith(waiter.tok)) { const w = waiter; waiter = null; const b = buf; buf = []; w.res(b) } })
const ask = (cmd, tok) => new Promise((res) => { waiter = { tok, res }; p.stdin.write(cmd + '\n') })
await ask('uci', 'uciok'); p.stdin.write('setoption name Threads value 1\nsetoption name Hash value 128\n'); await ask('isready', 'readyok')
async function search(fen, depth) {
  p.stdin.write(`position fen ${fen}\n`)
  const out = await ask(`go depth ${depth}`, 'bestmove')
  let sc = null, pv = []
  for (const l of out) { if (!l.startsWith('info') || !l.includes(' pv ')) continue; const m = / score (cp|mate) (-?\d+)/.exec(l); if (m) { sc = m; pv = l.split(' pv ')[1].trim().split(' ') } }
  if (!sc) return { v: 0, pv: [] }
  return { v: sc[1] === 'mate' ? (+sc[2] > 0 ? 50 : -50) : +sc[2] / 100, pv } // side-to-move point of view
}
const [A, B, OUT] = [+process.argv[2], +process.argv[3], process.argv[4]]
const book = JSON.parse(readFileSync('src/data/eco-openings.json', 'utf8'))
const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const mat = (g) => { let s = 0; for (const r of g.board()) for (const c of r) if (c) s += (c.color === 'w' ? 1 : -1) * VAL[c.type]; return s }
const seen = new Set()
let idx = -1
for (const [eco, name, pgn] of book) {
  idx++
  if (idx < A || idx >= B) continue
  const sans = pgn.replace(/\d+\.(\.\.)?/g, ' ').trim().split(/\s+/).filter(Boolean)
  if (sans.length < 4 || sans.length > 18) continue
  const g = new Chess()
  try { for (const s of sans) g.move(s) } catch { continue }
  if (g.isGameOver()) continue
  const key = g.fen().split(' ').slice(0, 4).join(' ')
  if (seen.has(key)) continue
  seen.add(key)
  const fen = g.fen(), stm = g.turn()
  const base = await search(fen, 10)
  if (base.v < -0.8 || base.v > 1.5) continue
  let worst = null
  for (const mv of g.moves({ verbose: true })) {
    if (!(mv.captured || mv.san.includes('+'))) continue
    const h = new Chess(fen); h.move(mv.san)
    if (h.isCheckmate() || h.isGameOver()) continue
    const r = await search(h.fen(), 10)
    const victim = -r.v
    const drop = base.v - victim
    if (drop >= 2.8 && (!worst || victim < worst.victim)) worst = { san: mv.san, victim, fen: h.fen() }
  }
  if (!worst) continue
  const deep = await search(worst.fen, 16)
  const h = new Chess(worst.fen); const m0 = mat(new Chess(fen)); const pv = []
  let n = 0, cut = 0
  for (const u of deep.pv.slice(0, 9)) {
    try { h.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }) } catch { break }
    pv.push(h.history().slice(-1)[0]); n++
    if (n % 2 === 1) {
      const gain = (stm === 'w' ? -1 : 1) * (mat(h) - m0) // trapper's net material gain since before the victim's move
      if (h.isCheckmate() || gain >= 2.5) { cut = n; break }
    }
  }
  if (!cut || cut < 3) continue
  const line = [...sans, worst.san, ...pv.slice(0, cut)]
  const f = new Chess(); line.forEach((s) => f.move(s))
  const fin = await search(f.fen(), 14)
  const trapperEnd = f.isCheckmate() ? 50 : (f.turn() === stm ? 1 : -1) * 0 + (f.turn() === stm ? -fin.v : fin.v)
  appendFileSync(OUT, JSON.stringify({ eco, name, prefix: sans, stm, victim: worst.san, before: base.v, after: -worst.victim, deep: -deep.v, end: trapperEnd, mate: f.isCheckmate(), line }) + '\n')
}
p.stdin.write('quit\n')
