// Stockfish helper for checking data. usage: node scripts/sf.mjs file.json
// file: [{id, fen, depth?}] -> prints best lines (MultiPV 3) with scores
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const enginePath = require('../node_modules/stockfish/scripts/findEngine.js')()
const p = spawn(process.execPath, [enginePath], { stdio: ['pipe', 'pipe', 'ignore'] })
const rl = createInterface({ input: p.stdout })
let waiter = null, buf = []
rl.on('line', (l) => { buf.push(l); if (waiter && l.startsWith(waiter.tok)) { const w = waiter; waiter = null; const b = buf; buf = []; w.res(b) } })
const ask = (cmd, tok) => new Promise((res) => { waiter = { tok, res }; p.stdin.write(cmd + '\n') })
await ask('uci', 'uciok')
p.stdin.write('setoption name MultiPV value 3\nsetoption name Threads value 4\n')
await ask('isready', 'readyok')
const items = JSON.parse(readFileSync(process.argv[2], 'utf8'))
for (const it of items) {
  p.stdin.write('ucinewgame\n'); await ask('isready', 'readyok')
  p.stdin.write(`position fen ${it.fen}\n`)
  const out = await ask(`go depth ${it.depth ?? 18}`, 'bestmove')
  const pv = new Map()
  for (const l of out) {
    if (!l.startsWith('info') || !l.includes(' pv ')) continue
    const n = +(/ multipv (\d+)/.exec(l)?.[1] ?? 1)
    const sc = / score (cp|mate) (-?\d+)/.exec(l)
    pv.set(n, `${sc[1]} ${sc[2]} : ${l.split(' pv ')[1].split(' ').slice(0, 8).join(' ')}`)
  }
  console.log(`## ${it.id}`); [...pv.entries()].sort((a,b)=>a[0]-b[0]).forEach(([n,s]) => console.log(`  ${n}. ${s}`))
}
p.stdin.write('quit\n')
