// Candidate screener: node_modules/.bin/tsx scripts/trapcand.mts "<id>|<pgn moves>" ...
// Plays the line legally, evaluates every position (depth 16) from the mating side's view and prints the victim move
// where the evaluation jumps, so the trap's mistake index can be chosen with engine evidence.
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { createRequire } from 'node:module'
import { Chess } from 'chess.js'
const require = createRequire(import.meta.url)
const p = spawn(process.execPath, [require('../node_modules/stockfish/scripts/findEngine.js')()], { stdio: ['pipe', 'pipe', 'ignore'] })
const rl = createInterface({ input: p.stdout })
let waiter: { tok: string; res: (b: string[]) => void } | null = null
let buf: string[] = []
rl.on('line', (l) => { buf.push(l); if (waiter && l.startsWith(waiter.tok)) { const w = waiter; waiter = null; const b = buf; buf = []; w.res(b) } })
const ask = (cmd: string, tok: string) => new Promise<string[]>((res) => { waiter = { tok, res }; p.stdin.write(cmd + '\n') })
await ask('uci', 'uciok'); p.stdin.write('setoption name Threads value 2\n'); await ask('isready', 'readyok')
async function ev(fen: string, pov: string) {
  p.stdin.write('ucinewgame\n'); await ask('isready', 'readyok'); p.stdin.write(`position fen ${fen}\n`)
  const out = await ask('go depth 16', 'bestmove'); let sc: RegExpExecArray | null = null
  for (const l of out) { const m = / score (cp|mate) (-?\d+)/.exec(l); if (m) sc = m }
  if (!sc) return 0; const sign = fen.split(' ')[1] === pov ? 1 : -1
  return sc[1] === 'mate' ? (+sc[2] * sign > 0 ? 99 : -99) : +((+sc[2] * sign) / 100).toFixed(1)
}
for (const arg of process.argv.slice(2)) {
  const [id, pgn] = arg.split('|'); const toks = pgn.replace(/\d+\.(\.\.)?/g, ' ').split(/\s+/).filter(Boolean)
  const g = new Chess(); const fens = [g.fen()]; let ok = true
  for (const m of toks) { try { g.move(m); fens.push(g.fen()) } catch { ok = false; console.log(id, 'ILLEGAL', m); break } }
  if (!ok) continue
  const mate = g.isCheckmate(); const pov = toks.length % 2 === 1 ? 'w' : 'b'
  const e: number[] = []; for (const f of fens) e.push(await ev(f, pov))
  // victim moves are made by the side that is not pov: move index i is by white if i even
  let best = -1, drop = 0
  for (let i = 0; i < toks.length; i++) { const byVictim = (i % 2 === 0) !== (pov === 'w'); if (!byVictim) continue; const d = e[i + 1] - e[i]; if (d > drop && e[i] <= 2.7) { drop = d; best = i } }
  console.log(JSON.stringify({ id, plies: toks.length, mate, side: pov, mistake: best, before: e[best], after: e[best + 1], san: toks[best], evals: e.map((x) => x).join(',') }))
}
p.stdin.write('quit\n'); process.exit(0)
