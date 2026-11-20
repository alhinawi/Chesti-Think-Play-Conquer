// Engine audit of every trap (Stockfish depth 20 + chess.js): npx tsx scripts/trapaudit.mts
// For each trap: legal line, who makes the mistake, engine best move vs the played mistake, evaluation
// before / after the mistake / at the end of the line, forced mate at the end (mate in N), net material won.
// Resumable: entries whose line signature and depth match are reused. Writes src/data/trap-audit.json.
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import { Chess } from 'chess.js'
import { TRAPS } from '../src/data/traps'
import { trapSig } from '../src/data/trap-gate'

const DEPTH = 20
const FILE = 'src/data/trap-audit.json'
const require = createRequire(import.meta.url)
const p = spawn(process.execPath, [require('../node_modules/stockfish/scripts/findEngine.js')()], { stdio: ['pipe', 'pipe', 'ignore'] })
const rl = createInterface({ input: p.stdout })
let waiter: { tok: string; res: (b: string[]) => void } | null = null
let buf: string[] = []
rl.on('line', (l) => { buf.push(l); if (waiter && l.startsWith(waiter.tok)) { const w = waiter; waiter = null; const b = buf; buf = []; w.res(b) } })
const ask = (cmd: string, tok: string) => new Promise<string[]>((res) => { waiter = { tok, res }; p.stdin.write(cmd + '\n') })
await ask('uci', 'uciok'); p.stdin.write('setoption name Threads value 2\n'); await ask('isready', 'readyok')

type Ev = { cp: number; mate: number | null; best: string }
// evaluation from the point of view of `pov` ('w' | 'b')
async function ev(fen: string, pov: 'w' | 'b'): Promise<Ev> {
  p.stdin.write('ucinewgame\n'); await ask('isready', 'readyok'); p.stdin.write(`position fen ${fen}\n`)
  const out = await ask(`go depth ${DEPTH}`, 'bestmove')
  let sc: RegExpExecArray | null = null
  for (const l of out) { const m = / score (cp|mate) (-?\d+)/.exec(l); if (m) sc = m }
  const best = out[out.length - 1].split(' ')[1] ?? ''
  const sign = fen.split(' ')[1] === pov ? 1 : -1
  if (!sc) return { cp: 0, mate: null, best }
  if (sc[1] === 'mate') { const n = +sc[2] * sign; return { cp: n > 0 ? 100 : -100, mate: n, best } }
  return { cp: +((+sc[2] * sign) / 100).toFixed(2), mate: null, best }
}
const VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 }
function material(fen: string, side: 'w' | 'b') {
  let me = 0, them = 0
  for (const ch of fen.split(' ')[0]) {
    const v = VAL[ch.toLowerCase()]
    if (!v) continue
    if ((ch === ch.toUpperCase() ? 'w' : 'b') === side) me += v; else them += v
  }
  return me - them
}

export type TrapAudit = {
  sig: string; depth: number; lineOk: boolean; victimMoves: boolean
  before: number; best: string; playedIsBest: boolean; after: number; end: number
  mateAtEnd: boolean; mateIn: number | null; lineMate: boolean
  material: number; plies: number
}
const old: Record<string, TrapAudit> = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {}
const out: Record<string, TrapAudit> = { ...old }
const t0 = Date.now()
let done = 0
for (const t of TRAPS) {
  const sig = trapSig(t)
  if (out[t.id]?.sig === sig && out[t.id].depth === DEPTH) continue
  if (Date.now() - t0 > 3000000) continue // resume on the next run
  const g = new Chess(); const fens = [g.fen()]; const ucis: string[] = []
  let ok = true
  try { for (const m of t.moves) { const mv = g.move(m); ucis.push(mv.from + mv.to + (mv.promotion ?? '')); fens.push(g.fen()) } } catch { ok = false }
  if (!ok) { out[t.id] = { sig, depth: DEPTH, lineOk: false } as TrapAudit; continue }
  const pov = t.side
  const victimMoves = (t.mistake % 2 === 0) === (t.side === 'b') // white moves at even plies
  const b = await ev(fens[t.mistake], pov)
  const a = await ev(fens[t.mistake + 1], pov)
  const e = await ev(fens[fens.length - 1], pov)
  const lineMate = g.isCheckmate()
  out[t.id] = {
    sig, depth: DEPTH, lineOk: true, victimMoves,
    before: b.cp, best: b.best, playedIsBest: b.best === ucis[t.mistake], after: a.cp, end: lineMate ? 100 : e.cp,
    mateAtEnd: lineMate || (e.mate !== null && e.mate > 0), mateIn: lineMate ? 0 : e.mate !== null && e.mate > 0 ? e.mate : null, lineMate,
    material: material(fens[fens.length - 1], pov) - material(fens[t.mistake], pov),
    plies: t.moves.length - t.mistake - 1,
  }
  done++
  fs.writeFileSync(FILE, JSON.stringify(out, null, 1) + "\n")
}
p.stdin.write('quit\n')
const ids = new Set(TRAPS.map((x) => x.id))
for (const k of Object.keys(out)) if (!ids.has(k)) delete out[k]
fs.writeFileSync(FILE, JSON.stringify(out, null, 1) + '\n')
const left = TRAPS.filter((x) => !(out[x.id]?.sig === trapSig(x) && out[x.id].depth === DEPTH)).length
console.log(JSON.stringify({ audited: done, total: TRAPS.length, remaining: left }))
process.exit(0)
