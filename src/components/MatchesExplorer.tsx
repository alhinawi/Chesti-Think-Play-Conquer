'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { replay, START_FEN } from '../lib/chess'
import { play } from '../lib/sound'
import ChessBoard from './ChessBoard'
import MoveControls from './MoveControls'
import { Badge } from './ui'

type MatchGame = {
  w: string
  b: string
  we: number
  be: number
  r: '1-0' | '0-1' | '1/2-1/2'
  d: string
  eco: string
  op: string
  u: string
  m: string[]
}

type MatchesIndex = { generated: string; letters: Record<string, number> }

const LETTERS = ['a', 'b', 'c', 'd', 'e'] as const
const PAGE = 60

export default function MatchesExplorer() {
  const [index, setIndex] = useState<MatchesIndex | null>(null)
  const [letter, setLetter] = useState<(typeof LETTERS)[number]>('a')
  const [games, setGames] = useState<MatchGame[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [result, setResult] = useState<'all' | '1-0' | '0-1'>('all')
  const [shown, setShown] = useState(PAGE)
  const [sel, setSel] = useState<MatchGame | null>(null)
  const cache = useRef<Record<string, MatchGame[]>>({})

  useEffect(() => {
    fetch('/matches/index.json').then((r) => r.json()).then(setIndex).catch(() => setIndex(null))
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    const done = (list: MatchGame[]) => {
      if (!alive) return
      setGames(list)
      setLoading(false)
      setSel((cur) => cur ?? list[0] ?? null)
    }
    if (cache.current[letter]) done(cache.current[letter])
    else
      fetch(`/matches/${letter}.json`)
        .then((r) => r.json())
        .then((list: MatchGame[]) => {
          cache.current[letter] = list
          done(list)
        })
        .catch(() => done([]))
    return () => {
      alive = false
    }
  }, [letter])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return games.filter(
      (g) =>
        (result === 'all' || g.r === result) &&
        (!needle ||
          g.w.toLowerCase().includes(needle) ||
          g.b.toLowerCase().includes(needle) ||
          g.op.toLowerCase().includes(needle) ||
          g.eco.toLowerCase().includes(needle)),
    )
  }, [games, q, result])

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-line bg-surface p-1 text-sm" role="tablist" aria-label="حرف ECO">
            {LETTERS.map((L) => (
              <button
                key={L}
                type="button"
                role="tab"
                aria-selected={letter === L}
                onClick={() => {
                  setLetter(L)
                  setShown(PAGE)
                }}
                className={`rounded-lg px-3 py-1.5 font-bold uppercase transition ${letter === L ? 'bg-gold text-[#1a1408]' : 'text-muted hover:text-ink'}`}
                dir="ltr"
              >
                {L}
                {index && <span className="ms-1 text-xs opacity-70">{index.letters[L] ?? 0}</span>}
              </button>
            ))}
          </div>
          <div className="flex rounded-xl border border-line bg-surface p-1 text-sm">
            {(['all', '1-0', '0-1'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setResult(r)
                  setShown(PAGE)
                }}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${result === r ? 'bg-gold text-[#1a1408]' : 'text-muted hover:text-ink'}`}
                dir="ltr"
              >
                {r === 'all' ? 'الكل' : r}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setShown(PAGE)
            }}
            placeholder="دوّر على لاعب أو افتتاحية أو ECO..."
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-gold/60"
          />
        </div>
        <p className="mb-2 text-xs text-muted">
          {loading ? 'بنحمّل...' : `${filtered.length} ماتش`}
        </p>
        <ul className="grid max-h-[70vh] gap-2 overflow-y-auto pe-1">
          {!loading &&
            filtered.slice(0, shown).map((g, i) => (
              <li key={`${g.u}-${i}`}>
                <button
                  type="button"
                  onClick={() => setSel(g)}
                  className={`luxe-card flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-4 py-3 text-start transition hover:border-gold/50 ${sel === g ? 'border-gold/60' : ''}`}
                >
                  <span className="font-bold" dir="ltr">
                    {g.w} <span className="text-xs text-muted">({g.we})</span> × {g.b}{' '}
                    <span className="text-xs text-muted">({g.be})</span>
                  </span>
                  <Badge tone={g.r === '1-0' ? 'gold' : 'emerald'}>{g.r}</Badge>
                  <span className="text-xs text-muted" dir="ltr">
                    {g.eco} · {g.op}
                  </span>
                  <span className="text-xs text-muted" dir="ltr">{g.d}</span>
                </button>
              </li>
            ))}
          {!loading && filtered.length > shown && (
            <li>
              <button
                type="button"
                onClick={() => setShown((s) => s + PAGE)}
                className="w-full rounded-xl border border-line bg-surface py-2 text-sm font-bold text-muted transition hover:text-ink"
              >
                عرض أكتر ({filtered.length - shown} باقيين)
              </button>
            </li>
          )}
        </ul>
      </div>
      <div>{sel ? <MatchReplay game={sel} /> : <p className="text-muted">اختار ماتش من القايمة.</p>}</div>
    </div>
  )
}

function MatchReplay({ game }: { game: MatchGame }) {
  const { fens, history } = useMemo(() => replay(START_FEN, game.m), [game])
  const [ply, setPly] = useState(0)
  const [auto, setAuto] = useState(false)
  const n = game.m.length

  useEffect(() => {
    setPly(0)
    setAuto(false)
  }, [game])

  const go = useCallback(
    (k: number) => {
      const target = Math.max(0, Math.min(n, k))
      setPly((cur) => {
        if (target === cur + 1) {
          const mv = history[cur]
          play(mv.san.includes('#') ? 'end' : mv.san.includes('+') ? 'check' : mv.captured ? 'capture' : 'move')
        }
        return target
      })
    },
    [n, history],
  )

  useEffect(() => {
    if (!auto) return
    if (ply >= n) {
      setAuto(false)
      return
    }
    const id = setTimeout(() => go(ply + 1), 1100)
    return () => clearTimeout(id)
  }, [auto, ply, n, go])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(ply - 1)
      if (e.key === 'ArrowLeft') go(ply + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, ply])

  const lastMove = ply > 0 ? ([history[ply - 1].from, history[ply - 1].to] as [string, string]) : null

  return (
    <div className="luxe-card rounded-2xl p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold" dir="ltr">
          {game.w} <span className="text-sm text-muted">({game.we})</span> × {game.b}{' '}
          <span className="text-sm text-muted">({game.be})</span>
        </h2>
        <Badge tone={game.r === '1-0' ? 'gold' : 'emerald'}>{game.r}</Badge>
      </div>
      <p className="mb-3 text-sm text-muted" dir="ltr">
        {game.eco} · {game.op} · {game.d}
      </p>
      <ChessBoard fen={fens[ply]} movable={false} lastMove={lastMove} />
      <div className="mt-3">
        <MoveControls ply={ply} total={n} go={go} auto={auto} onToggle={() => setAuto((a) => !a)} />
      </div>
      <ol dir="ltr" className="mt-3 grid max-h-48 grid-cols-2 gap-x-4 gap-y-0.5 overflow-y-auto text-sm sm:grid-cols-3">
        {Array.from({ length: Math.ceil(n / 2) }, (_, i) => (
          <li key={i} className="flex gap-1">
            <span className="w-6 shrink-0 text-muted">{i + 1}.</span>
            <button
              type="button"
              onClick={() => go(i * 2 + 1)}
              className={`rounded px-1 font-mono hover:bg-surface ${ply === i * 2 + 1 ? 'bg-gold/20 text-gold' : ''}`}
            >
              {game.m[i * 2]}
            </button>
            {game.m[i * 2 + 1] && (
              <button
                type="button"
                onClick={() => go(i * 2 + 2)}
                className={`rounded px-1 font-mono hover:bg-surface ${ply === i * 2 + 2 ? 'bg-gold/20 text-gold' : ''}`}
              >
                {game.m[i * 2 + 1]}
              </button>
            )}
          </li>
        ))}
      </ol>
      <a
        href={game.u}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block text-xs text-muted underline decoration-dotted hover:text-ink"
        dir="ltr"
      >
        {game.u}
      </a>
    </div>
  )
}
