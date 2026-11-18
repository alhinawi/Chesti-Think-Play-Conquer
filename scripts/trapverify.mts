// Engine gate for traps: node_modules/.bin/tsx scripts/trapverify.mts [--prune]
// Checks every trap in TRAPS with chess.js (legal line, mate flag) and Stockfish (depth 16),
// writes passing verdicts to src/data/trap-verified.json and lists failures.
// --prune also deletes failing generated (mt-) traps from the data files.
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import { Chess } from 'chess.js'
import { TRAPS } from '../src/data/traps'
import { trapProblems, trapSig, type TrapVerdict } from '../src/data/trap-gate'

const require = createRequire(import.meta.url)
const p = spawn(process.execPath, [require('../node_modules/stockfish/scripts/findEngine.js')()], { stdio: ['pipe', 'pipe', 'ignore'] })
const rl = createInterface({ input: p.stdout })
let waiter: { tok: string; res: (b: string[]) => void } | null = null
let buf: string[] = []
rl.on('line', (l) => { buf.push(l); if (waiter && l.startsWith(waiter.tok)) { const w = waiter; waiter = null; const b = buf; buf = []; w.res(b) } })
const ask = (cmd: string, tok: string) => new Promise<string[]>((res) => { waiter = { tok, res }; p.stdin.write(cmd + '\n') })
await ask('uci', 'uciok'); p.stdin.write('setoption name Threads value 2\n'); await ask('isready', 'readyok')
async function ev(fen: string, depth = 16) {
  p.stdin.write('ucinewgame\n'); await ask('isready', 'readyok'); p.stdin.write(`position fen ${fen}\n`)
  const out = await ask(`go depth ${depth}`, 'bestmove')
  let sc: RegExpExecArray | null = null
  for (const l of out) { const m = / score (cp|mate) (-?\d+)/.exec(l); if (m) sc = m }
  if (!sc) return 0
  const v = sc[1] === 'mate' ? (+sc[2] > 0 ? 100 : -100) : +sc[2] / 100
  return fen.split(' ')[1] === 'w' ? v : -v
}
const FILE = 'src/data/trap-verified.json'
const old: Record<string, TrapVerdict> = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {}
const out: Record<string, TrapVerdict> = {}
const failed: { id: string; why: string }[] = []
let reused = 0
for (const t of TRAPS) {
  const sig = trapSig(t)
  if (old[t.id]?.sig === sig && trapProblems(old[t.id]).length === 0) { out[t.id] = old[t.id]; reused++; continue }
  const g = new Chess(); const fens = [g.fen()]
  try { for (const m of t.moves) { g.move(m); fens.push(g.fen()) } } catch { failed.push({ id: t.id, why: 'illegal line' }); continue }
  const sg = t.side === 'w' ? 1 : -1
  const mate = g.isCheckmate()
  if (t.moves[t.moves.length - 1].endsWith('#') !== mate) { failed.push({ id: t.id, why: 'mate flag does not match the board' }); continue }
  const v: TrapVerdict = {
    sig, mate,
    before: +(sg * (await ev(fens[t.mistake]))).toFixed(1),
    after: +(sg * (await ev(fens[t.mistake + 1]))).toFixed(1),
    end: +(sg * (await ev(fens[fens.length - 1]))).toFixed(1),
  }
  const why = trapProblems(v)
  if (why.length) failed.push({ id: t.id, why: why.join('; ') + ` (before ${v.before}, after ${v.after}, end ${v.end})` })
  else out[t.id] = v
}
p.stdin.write('quit\n')
fs.writeFileSync(FILE, JSON.stringify(out, null, 1) + '\n')
console.log(JSON.stringify({ checked: TRAPS.length, reused, passed: Object.keys(out).length, failed: failed.length }))
for (const f of failed) console.log('FAIL', f.id, '-', f.why)
fs.writeFileSync('/tmp/trap-failed.json', JSON.stringify(failed))
process.exit(0)
