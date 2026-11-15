'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ChessBoard, { type BoardArrow } from './ChessBoard'
import BoardStage from './BoardStage'
import { ConfirmButton, MoveList, PlayerBar, ResultCard } from './GameParts'
import { Badge, Button, Icon } from './ui'
import { gameResult, soundFor, toUci, type UciMove } from '../lib/chess'
import { Engine, LEVELS } from '../lib/engine'
import { formatEval, pickComputerMove, playUci } from '../lib/game'
import { play } from '../lib/sound'
import { botForLevel } from '../data/bots'
import { COACH, coachLine } from '../lib/coach'
import { recordGame } from '../lib/progress'
import { saveGame } from '../lib/api'
import { OPENINGS } from '../data/openings'
import { Chess } from 'chess.js'
import { celebrate } from './Celebrate'
import ShareButton from './ShareButton'
import Analysis from './Analysis'

const SAVE_KEY = 'chesti-vs-computer'

interface Saved {
  level: number
  color: 'w' | 'b'
  moves: string[]
  resigned: boolean
  started: boolean
  hints: number
}

const FRESH: Saved = { level: 2, color: 'w', moves: [], resigned: false, started: false, hints: 0 }

function load(): Saved {
  try {
    const s = { ...FRESH, ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }
    if (!LEVELS.some((l) => l.id === s.level)) s.level = FRESH.level
    return s
  } catch {
    return FRESH
  }
}

export default function PlayComputer() {
  const [s, setS] = useState<Saved>(FRESH)
  const [loaded, setLoaded] = useState(false)
  const [pickColor, setPickColor] = useState<'w' | 'b' | 'random'>('w')
  const [thinking, setThinking] = useState(false)
  const [hint, setHint] = useState<BoardArrow | null>(null)
  const [evalText, setEvalText] = useState<string | null>(null)
  const [engineError, setEngineError] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [shake, setShake] = useState(0)
  const [coach, setCoach] = useState<string | null>(null)
  const [botSays, setBotSays] = useState<string | null>(null)
  const [analyze, setAnalyze] = useState(false)
  const [seed, setSeed] = useState<{ id: string; name: string; moves: string[] } | null>(null)
  const engineRef = useRef<Engine | null>(null)
  const gen = useRef(0)

  useEffect(() => {
    const saved = load()
    loadedKey.current = `${saved.moves.join('')}|${saved.resigned}`
    // ?opening=<id>: seed a fresh game from the opening's main line
    const m = /[?&]opening=([\w-]+)/.exec(window.location.search)
    const op = m && OPENINGS.find((o) => o.id === m[1])
    if (op && saved.moves.length === 0) {
      const g = new Chess()
      const uci = op.moves.map((san) => {
        const r = g.move(san)
        return r.from + r.to + (r.promotion || '')
      })
      setSeed({ id: op.id, name: op.name, moves: uci })
      saved.moves = uci
    }
    setS(saved)
    setPickColor(saved.color)
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem(SAVE_KEY, JSON.stringify(s))
  }, [s, loaded])

  const engine = useCallback(() => {
    if (!engineRef.current) {
      const e = new Engine()
      e.onError = () => setEngineError(true)
      engineRef.current = e
    }
    return engineRef.current
  }, [])

  useEffect(() => () => engineRef.current?.terminate(), [])

  const level = LEVELS.find((l) => l.id === s.level) ?? LEVELS[0]
  const bot = botForLevel(level.id)
  const { game, sans, lastMove } = useMemo(() => playUci(s.moves), [s.moves])
  const fen = game.fen()
  const turn = game.turn()
  const result = gameResult(game)
  const over = result.over || s.resigned
  const userTurn = s.started && !over && turn === s.color

  // the computer's move
  useEffect(() => {
    if (!s.started || over || turn === s.color || engineError) return
    const myGen = ++gen.current
    setThinking(true)
    const t0 = Date.now()
    engine()
      .search(fen, { skill: level.skill, depth: level.depth, movetime: level.movetime })
      .then(async ({ best }) => {
        const mv = pickComputerMove(fen, best, level.randomness)
        const wait = 450 - (Date.now() - t0)
        if (wait > 0) await new Promise((r) => setTimeout(r, wait))
        if (myGen !== gen.current || !mv) return
        setS((cur) => (cur.moves.length === s.moves.length ? { ...cur, moves: [...cur.moves, mv] } : cur))
      })
      .catch(() => setEngineError(true))
      .finally(() => {
        if (myGen === gen.current) setThinking(false)
      })
  }, [s.started, s.moves.length, over, turn, s.color, fen, level, engine, engineError, s.moves])

  // sound for each new move
  const prevLen = useRef(0)
  useEffect(() => {
    if (s.moves.length > prevLen.current && s.moves.length > 0) {
      const last = game.history({ verbose: true }).at(-1)
      if (last) {
        soundFor(last, game)
        if (last.color === s.color) {
          const line = coachLine({ san: last.san, piece: last.piece, captured: last.captured, promotion: last.promotion, flags: last.flags, mate: game.isCheckmate(), check: game.inCheck(), moveNo: Math.ceil(s.moves.length / 2) })
          setCoach(line)
          if (game.inCheck() && !game.isCheckmate()) setBotSays(bot.checked)
        } else setBotSays(null)
      }
    }
    prevLen.current = s.moves.length
    setHint(null)
    setEvalText(null)
  }, [s.moves.length, game, s.color, bot])

  // win / lose sound
  const recorded = useRef<string | null>(null)
  useEffect(() => {
    if (!s.started || !(result.over || s.resigned)) return
    const key = `${s.moves.join('')}|${s.resigned}`
    if (recorded.current === key) return
    recorded.current = key
    const won = !s.resigned && result.winner === s.color
    if (won) {
      play('success')
      celebrate(true)
    }
    setBotSays(won ? bot.loses : result.winner === null && !s.resigned ? null : bot.wins)
    // only games that really ended now count, not a finished game loaded from storage
    if (s.moves.length > 0 && prevLen.current === s.moves.length && loadedKey.current !== key) {
      recordGame(bot.id, won)
      saveGame({
        result: won ? 'win' : !s.resigned && result.winner === null ? 'draw' : 'loss',
        mode: 'computer',
        opponent: bot.id,
        color: s.color === 'w' ? 'white' : 'black',
        moves: s.moves.length,
        pgn: game.pgn(),
      })
    }
  }, [result.over, result.winner, s.color, s.started, s.resigned, s.moves, bot])
  const loadedKey = useRef<string | null>(null)

  function onMove(m: UciMove) {
    if (!userTurn) return false
    const uci = toUci(m)
    const r = playUci([...s.moves, uci])
    if (r.moves.length !== s.moves.length + 1) {
      setShake((x) => x + 1)
      play('error')
      return false
    }
    setS((cur) => ({ ...cur, moves: [...cur.moves, uci] }))
    return true
  }

  function start() {
    const color = pickColor === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : pickColor
    gen.current++
    setFlipped(false)
    setEngineError(false)
    setS((cur) => ({ ...cur, color, moves: seed?.moves ?? [], resigned: false, started: true, hints: 0 }))
    setCoach(null)
    setAnalyze(false)
    setBotSays(botForLevel(s.level).greet)
    engine() // warm up the engine while the user thinks
  }

  function undo() {
    gen.current++
    engineRef.current?.stop()
    setThinking(false)
    setS((cur) => {
      // take back to the last position where it was the user's turn
      let n = cur.moves.length - 1
      while (n > 0 && n % 2 !== (cur.color === 'w' ? 0 : 1)) n--
      if (cur.color === 'b' && n < 1) n = Math.min(1, cur.moves.length)
      return { ...cur, moves: cur.moves.slice(0, Math.max(0, n)), resigned: false }
    })
  }

  async function askHint() {
    if (!userTurn) return
    setThinking(true)
    try {
      const { best, lines } = await engine().search(fen, { skill: 20, depth: 12 })
      if (best && best !== '(none)') setHint({ from: best.slice(0, 2), to: best.slice(2, 4), color: 'green' })
      if (lines[0]) setEvalText(formatEval(lines[0], turn))
      setS((cur) => ({ ...cur, hints: cur.hints + 1 }))
    } catch {
      setEngineError(true)
    } finally {
      setThinking(false)
    }
  }

  if (!loaded) return <div className="h-96 animate-pulse rounded-2xl bg-surface" />

  if (!s.started) {
    return (
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-3 font-display text-xl font-bold">اختار هتلعب ضد مين</h2>
        {seed && (
          <p className="mb-3 rounded-xl border border-gold/30 bg-gold-soft p-3 text-sm">
            بتجرب افتتاحية <b>{seed.name}</b>: الدور هيبدأ من آخر نقلة في الخط الرئيسي.
          </p>
        )}
        <div role="radiogroup" aria-label="المستوى" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={s.level === l.id}
              onClick={() => setS((cur) => ({ ...cur, level: l.id }))}
              className={`rounded-2xl border p-3 text-start transition ${s.level === l.id ? 'border-gold bg-gold-soft shadow-[0_0_0_1px_var(--gold)]' : 'border-line bg-surface hover:border-gold/50'}`}
            >
              <span className="flex items-center gap-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-b from-gold-2 to-gold text-xs font-bold text-[#1a1408]" aria-hidden>{botForLevel(l.id).initials}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold"><bdi className="ltr">{botForLevel(l.id).name}</bdi></span>
                  <span className="text-xs text-muted">{l.name} <bdi className="ltr">{l.id}/8</bdi></span>
                </span>
              </span>
              <span className="mt-1 flex gap-0.5" aria-hidden>
                {LEVELS.map((x) => (
                  <span key={x.id} className={`h-1 flex-1 rounded-full ${x.id <= l.id ? 'bg-gold' : 'bg-line'}`} />
                ))}
              </span>
              <span className="mt-2 block text-xs text-muted">{botForLevel(l.id).tagline}</span>
            </button>
          ))}
        </div>

        <h2 className="mt-6 mb-3 font-display text-xl font-bold">هتلعب بأنهي لون؟</h2>
        <div role="radiogroup" aria-label="اللون" className="grid grid-cols-3 gap-2">
          {(
            [
              ['w', 'الأبيض', '♔'],
              ['random', 'عشوائي', '?'],
              ['b', 'الأسود', '♚'],
            ] as const
          ).map(([v, label, g]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={pickColor === v}
              onClick={() => setPickColor(v)}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-3 transition ${pickColor === v ? 'border-gold bg-gold-soft' : 'border-line bg-surface hover:border-gold/50'}`}
            >
              <span className="text-3xl leading-none" aria-hidden>{g}</span>
              <span className="text-sm font-bold">{label}</span>
            </button>
          ))}
        </div>

        <Button onClick={start} className="mt-6 w-full py-3.5 text-base">
          <Icon name="play" /> {s.moves.length > 0 && !over ? 'ابدأ دور جديد' : 'يلا نلعب'}
        </Button>
        {s.moves.length > 0 && !over && (
          <Button variant="outline" onClick={() => setS((cur) => ({ ...cur, started: true }))} className="mt-2 w-full py-3">
            كمّل الدور اللي فات ({Math.ceil(s.moves.length / 2)} نقلة)
          </Button>
        )}
        <p className="mt-3 text-center text-xs text-muted">المحرك Stockfish 19 بيشتغل جوه متصفحك، من غير نت بعد ما الصفحة تحمّل.</p>
      </div>
    )
  }

  const orientation = (s.color === 'w') !== flipped ? 'white' : 'black'
  const top: 'w' | 'b' = orientation === 'white' ? 'b' : 'w'
  const bar = (c: 'w' | 'b') =>
    c === s.color ? (
      <PlayerBar fen={fen} color={c} name="إنت" active={userTurn} />
    ) : (
      <PlayerBar
        fen={fen}
        color={c}
        initials={bot.initials}
        name={bot.name}
        active={thinking && turn !== s.color}
        sub={thinking && turn !== s.color ? <span>بيفكر…</span> : null}
      />
    )

  let outcome: { title: string; text?: string; tone: 'win' | 'lose' | 'draw' } | null = null
  if (s.resigned) outcome = { title: 'استسلمت', text: 'مش مشكلة، الدور الجاي أحسن.', tone: 'lose' }
  else if (result.over)
    outcome =
      result.winner === null
        ? { title: 'تعادل', text: result.text, tone: 'draw' }
        : result.winner === s.color
          ? { title: 'كسبت! برافو عليك', text: `كش مات في ${Math.ceil(s.moves.length / 2)} نقلة${s.hints ? ` واستخدمت ${s.hints} تلميح` : ''}.`, tone: 'win' }
          : { title: `${bot.name} كسب`, text: 'كش مات. جرب مستوى أسهل أو العب تاني.', tone: 'lose' }

  const actions = (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Button variant="soft" onClick={askHint} disabled={!userTurn || thinking}>
        <Icon name="bulb" /> تلميح
      </Button>
      <Button variant="soft" onClick={undo} disabled={s.moves.length === 0 || (s.color === 'b' && s.moves.length <= 1)}>
        <Icon name="undo" /> رجوع
      </Button>
      <Button variant="soft" onClick={() => setFlipped((f) => !f)}>
        <Icon name="flip" /> اقلب
      </Button>
      <ConfirmButton icon="flag" label="استسلم" confirm="متأكد إنك عايز تستسلم؟" disabled={over} onConfirm={() => setS((cur) => ({ ...cur, resigned: true }))} />
    </div>
  )
  const statusLine = (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm" aria-live="polite">
      <span>{outcome ? <strong className="text-gold">{outcome.title}</strong> : thinking && turn !== s.color ? 'الكمبيوتر بيفكر…' : userTurn ? 'دورك.' : '…'}</span>
      {outcome && (
        <Button onClick={start} className="px-3 py-1.5">
          <Icon name="reset" className="h-4 w-4" /> دور تاني
        </Button>
      )}
    </div>
  )
  const fsExtras = (
    <>
      {statusLine}
      {actions}
    </>
  )

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,1fr)] lg:gap-8">
      <BoardStage fsExtras={fsExtras} fsReserve={18.5}>
        {bar(top)}
        <ChessBoard fen={fen} orientation={orientation} movable={userTurn ? s.color : false} onMove={onMove} lastMove={lastMove} arrows={hint ? [hint] : undefined} shake={shake} />
        {bar(top === 'w' ? 'b' : 'w')}
      </BoardStage>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{level.name}</Badge>
          <Badge tone="muted">بتلعب بـ{s.color === 'w' ? 'الأبيض' : 'الأسود'}</Badge>
          {game.inCheck() && !over && <Badge tone="danger">كش!</Badge>}
        </div>

        {engineError && (
          <div role="alert" className="rounded-2xl border border-danger/50 bg-danger/10 p-4 text-sm">
            المحرك ما اشتغلش على الجهاز ده. جرب تحدّث الصفحة، أو افتحها من متصفح تاني.
          </div>
        )}

        {(botSays || coach) && (
          <div className="flex flex-col gap-2">
            {botSays && (
              <p key={`b-${botSays}`} className="animate-bubble flex items-start gap-2 text-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-gold-2 to-gold text-[0.65rem] font-bold text-[#1a1408]" aria-hidden>{bot.initials}</span>
                <span className="rounded-2xl rounded-ss-sm border border-line bg-surface px-3 py-2"><strong className="me-1 text-gold"><bdi className="ltr">{bot.name}</bdi>:</strong>{botSays}</span>
              </p>
            )}
            {coach && (
              <p key={`c-${coach}`} className="animate-bubble flex items-start gap-2 text-sm" aria-live="polite">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald/20 text-base text-emerald" aria-hidden>☕</span>
                <span className="rounded-2xl rounded-ss-sm border border-emerald/30 bg-emerald/5 px-3 py-2"><strong className="me-1 text-emerald">{COACH.name}:</strong>{coach}</span>
              </p>
            )}
          </div>
        )}

        {outcome ? (
          <ResultCard {...outcome}>
            <Button onClick={start}>
              <Icon name="reset" /> دور تاني
            </Button>
            {s.moves.length >= 4 && (
              <Button variant="soft" onClick={() => setAnalyze(true)} disabled={analyze}>
                <Icon name="cpu" /> حلّل الدور
              </Button>
            )}
            {outcome.tone === 'win' && <ShareButton text={`كسبت ${bot.name} (مستوى ${level.id} من 8) في ${Math.ceil(s.moves.length / 2)} نقلة على Chesti ♞ تقدر تعملها؟`} path="/play/computer/" />}
            <Button variant="soft" onClick={() => setS((cur) => ({ ...cur, started: false }))}>
              غيّر المستوى
            </Button>
          </ResultCard>
        ) : (
          <p className="rounded-xl border border-line bg-surface p-3 text-sm" aria-live="polite">
            {thinking && turn !== s.color ? 'الكمبيوتر بيفكر…' : userTurn ? (s.moves.length === 0 ? 'دورك. ابدأ بأي نقلة.' : 'دورك.') : '…'}
            {evalText && <span className="ms-2 text-muted">تقييم المحرك: <bdi className="font-bold text-gold">{evalText}</bdi></span>}
          </p>
        )}

        {actions}

        {analyze && <Analysis moves={s.moves} userColor={s.color} />}

        <MoveList sans={sans} />

        <div className="flex flex-wrap gap-2">
          <ConfirmButton icon="reset" label="دور جديد" confirm="تبدأ دور جديد؟ الدور ده هيتمسح." disabled={s.moves.length === 0 && !over} onConfirm={start} />
          <Button variant="ghost" onClick={() => setS((cur) => ({ ...cur, started: false }))}>
            غيّر المستوى أو اللون
          </Button>
        </div>
      </div>
    </div>
  )
}
