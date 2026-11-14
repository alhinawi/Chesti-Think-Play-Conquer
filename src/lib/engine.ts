// Stockfish 19 (lite, single-threaded WASM) running in a Web Worker.
// Loaded only on the pages that need it.

export interface EngineLine {
  move: string
  cp?: number
  mate?: number
}

export interface SearchOptions {
  skill?: number // 0..20
  depth?: number
  movetime?: number
  multipv?: number
}

type Listener = (line: string) => void

export class Engine {
  private worker: Worker
  private listeners = new Set<Listener>()
  private ready: Promise<void>
  private busy: Promise<unknown> = Promise.resolve()
  private currentSkill = -1
  private currentMultiPv = 1
  /** called when the worker fails to load or crashes */
  onError?: (message: string) => void

  constructor() {
    this.worker = new Worker('/engine/stockfish-19-lite-single.js')
    this.worker.onmessage = (e: MessageEvent) => {
      const line = typeof e.data === 'string' ? e.data : String(e.data)
      this.listeners.forEach((l) => l(line))
    }
    this.worker.onerror = (e: ErrorEvent) => {
      e.preventDefault?.()
      this.onError?.(e.message || 'engine failed')
    }
    this.ready = (async () => {
      await this.waitFor('uci', 'uciok')
      await this.waitFor('isready', 'readyok')
    })()
  }

  private send(cmd: string) {
    this.worker.postMessage(cmd)
  }

  private waitFor(cmd: string, token: string): Promise<string[]> {
    return new Promise((resolve) => {
      const lines: string[] = []
      const l: Listener = (line) => {
        lines.push(line)
        if (line.startsWith(token)) {
          this.listeners.delete(l)
          resolve(lines)
        }
      }
      this.listeners.add(l)
      this.send(cmd)
    })
  }

  /** Search a position. Calls are queued so they never overlap. */
  search(fen: string, opts: SearchOptions = {}): Promise<{ best: string; lines: EngineLine[] }> {
    const run = async () => {
      await this.ready
      const skill = opts.skill ?? 20
      if (skill !== this.currentSkill) {
        this.send(`setoption name Skill Level value ${skill}`)
        this.currentSkill = skill
      }
      const mpv = opts.multipv ?? 1
      if (mpv !== this.currentMultiPv) {
        this.send(`setoption name MultiPV value ${mpv}`)
        this.currentMultiPv = mpv
      }
      this.send('ucinewgame')
      await this.waitFor('isready', 'readyok')
      this.send(`position fen ${fen}`)
      const go = opts.depth ? `go depth ${opts.depth}` : `go movetime ${opts.movetime ?? 1000}`
      const out = await this.waitFor(go, 'bestmove')
      const byPv = new Map<number, EngineLine>()
      for (const line of out) {
        if (!line.startsWith('info') || !line.includes(' pv ')) continue
        const pv = Number(/ multipv (\d+)/.exec(line)?.[1] ?? 1)
        const move = / pv (\S+)/.exec(line)?.[1]
        if (!move) continue
        const cp = / score cp (-?\d+)/.exec(line)?.[1]
        const mate = / score mate (-?\d+)/.exec(line)?.[1]
        byPv.set(pv, { move, cp: cp !== undefined ? Number(cp) : undefined, mate: mate !== undefined ? Number(mate) : undefined })
      }
      const best = /bestmove (\S+)/.exec(out[out.length - 1])?.[1] ?? ''
      const lines = [...byPv.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1])
      return { best, lines }
    }
    const p = this.busy.then(run, run)
    this.busy = p.catch(() => undefined)
    return p
  }

  stop() {
    this.send('stop')
  }

  terminate() {
    this.worker.terminate()
    this.listeners.clear()
  }
}

export interface Level {
  id: number
  name: string
  desc: string
  skill: number
  depth?: number
  movetime?: number
  /** chance of playing a random legal move instead of the engine move (to make the low levels human) */
  randomness: number
}

export const LEVELS: Level[] = [
  { id: 1, name: 'مبتدئ خالص', desc: 'لسه بيتعلم القطع بتمشي إزاي', skill: 0, depth: 1, randomness: 0.45 },
  { id: 2, name: 'مبتدئ', desc: 'بيسيب قطع كتير من غير حماية', skill: 1, depth: 2, randomness: 0.2 },
  { id: 3, name: 'هاوي', desc: 'بيشوف التهديدات القريبة', skill: 3, depth: 4, randomness: 0.06 },
  { id: 4, name: 'متوسط', desc: 'لاعب نادي كويس', skill: 6, depth: 6, randomness: 0 },
  { id: 5, name: 'قوي', desc: 'هيعاقبك على أي غلطة', skill: 10, depth: 9, randomness: 0 },
  { id: 6, name: 'محترف', desc: 'خبرة بطولات', skill: 15, depth: 12, randomness: 0 },
  { id: 7, name: 'أستاذ', desc: 'مستوى جراند ماستر', skill: 20, movetime: 800, randomness: 0 },
  { id: 8, name: 'الوحش', desc: 'ستوكفيش بكل قوته', skill: 20, movetime: 2000, randomness: 0 },
]
