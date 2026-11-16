'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ChessBoard, { type BoardArrow } from './ChessBoard'
import BoardStage from './BoardStage'
import { ConfirmButton, HistoryNav, MoveList, PlayerBar, ResultCard, ReviewBanner } from './GameParts'
import { Badge, Button, Icon } from './ui'
import { gameResult, soundFor, toUci, type UciMove } from '../lib/chess'
import { Engine, LEVELS } from '../lib/engine'
import { formatEval, pickComputerMove, playUci } from '../lib/game'
import { play } from '../lib/sound'
import { botForLevel } from '../data/bots'
import { BotAvatar } from './BotAvatar'
import { COACH, coachLine } from '../lib/coach'
import { recordGame } from '../lib/progress'
import { saveGame } from '../lib/api'
import { MatchTelemetry } from '../lib/telemetry'
import { LiveGameSession } from '../lib/liveGame'
import { OPENINGS } from '../data/openings'
import { Chess } from 'chess.js'
import { celebrate } from './Celebrate'
import ShareButton from './ShareButton'
import Analysis from './Analysis'
import { useI18n } from '../lib/i18n'

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
  const { t } = useI18n()
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
  const telemetryRef = useRef<MatchTelemetry | null>(null)
  const liveRef = useRef<LiveGameSession | null>(null)
  const livePushed = useRef(0)
  const [liveReady, setLiveReady] = useState(0)
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
  // review mode: `back` = how many plies behind the live position we're viewing (0 = live, chess.com style)
  const [back, setBack] = useState(0)
  useEffect(() => setBack(0), [s.moves.length])
  const live = back === 0
  const view = useMemo(() => (back > 0 ? playUci(s.moves.slice(0, Math.max(0, s.moves.length - back))) : null), [s.moves, back])
  const shownPly = s.moves.length - back
  const shownFen = view ? view.game.fen() : game.fen()
  const shownLast = view ? view.lastMove : lastMove
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
    // relay every new half-move to the server (anti-cheat live session)
    const sess = liveRef.current
    if (sess && !sess.broken) {
      while (livePushed.current < s.moves.length) sess.push(s.moves[livePushed.current++])
    }
    if (s.moves.length > prevLen.current && s.moves.length > 0) {
      const last = game.history({ verbose: true }).at(-1)
      if (last) {
        telemetryRef.current?.tick(last.color === s.color)
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
  }, [s.moves.length, game, s.color, bot, liveReady])

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
      const payload = {
        result: (won ? 'win' : !s.resigned && result.winner === null ? 'draw' : 'loss') as 'win' | 'loss' | 'draw',
        mode: 'computer' as const,
        opponent: bot.id,
        color: (s.color === 'w' ? 'white' : 'black') as 'white' | 'black',
        moves: s.moves.length,
        pgn: game.pgn(),
        duration_seconds: telemetryRef.current?.durationSeconds() || undefined,
        telemetry: telemetryRef.current?.finish(level.id),
      }
      const sess = liveRef.current
      if (sess && !sess.broken) {
        // server finalizes + records the game; fall back to the old upload if the session broke
        sess.end(payload.result, payload.telemetry?.signals).then((fate) => {
          if (fate === 'legacy') saveGame(payload)
        })
      } else saveGame(payload)
    }
  }, [result.over, result.winner, s.color, s.started, s.resigned, s.moves, bot])
  const loadedKey = useRef<string | null>(null)

  function onMove(m: UciMove) {
    if (!live) return false
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
    if (!telemetryRef.current) telemetryRef.current = new MatchTelemetry()
    telemetryRef.current.start()
    // start the server-authoritative live session (anti-cheat); null when logged out/offline
    liveRef.current = null
    livePushed.current = 0
    // seeded games (opening practice) start mid-position: the server starts
    // from the initial position, so relaying them would corrupt timing data
    if ((seed?.moves?.length ?? 0) === 0) {
      const myGen = gen.current
      LiveGameSession.start(botForLevel(s.level).id, color === 'w' ? 'white' : 'black').then((sess) => {
        if (sess && gen.current === myGen) {
          liveRef.current = sess
          setLiveReady((x) => x + 1)
        }
      })
    }
    engine() // warm up the engine while the user thinks
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
        <h2 className="mb-3 font-display text-xl font-bold">{t('pc.pickOpponent')}</h2>
        {seed && (
          <p className="mb-3 rounded-xl border border-gold/30 bg-gold-soft p-3 text-sm">
            {t('pc.openingSeedPre')}<b>{seed.name}</b>{t('pc.openingSeedPost')}
          </p>
        )}
        <div role="radiogroup" aria-label={t('pc.levelAria')} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                <BotAvatar bot={botForLevel(l.id)} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold"><bdi className="ltr">{botForLevel(l.id).name}</bdi></span>
                  <span className="text-xs text-muted">{t(`pc.el${l.id}Name`)} <bdi className="ltr">{l.id}/8</bdi></span>
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

        <h2 className="mt-6 mb-3 font-display text-xl font-bold">{t('pc.pickColor')}</h2>
        <div role="radiogroup" aria-label={t('pc.colorAria')} className="grid grid-cols-3 gap-2">
          {(
            [
              ['w', t('pc.white'), '♔'],
              ['random', t('pc.random'), '?'],
              ['b', t('pc.black'), '♚'],
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
          <Icon name="play" /> {s.moves.length > 0 && !over ? t('pc.newGame') : t('pc.letsPlay')}
        </Button>
        {s.moves.length > 0 && !over && (
          <Button variant="outline" onClick={() => setS((cur) => ({ ...cur, started: true }))} className="mt-2 w-full py-3">
            {t('pc.resumeGame', { n: Math.ceil(s.moves.length / 2) })}
          </Button>
        )}
        <p className="mt-3 text-center text-xs text-muted">{t('pc.engineNote')}</p>
      </div>
    )
  }

  const orientation = (s.color === 'w') !== flipped ? 'white' : 'black'
  const top: 'w' | 'b' = orientation === 'white' ? 'b' : 'w'
  const bar = (c: 'w' | 'b') =>
    c === s.color ? (
      <PlayerBar fen={shownFen} color={c} name={t('pc.you')} active={userTurn && live} />
    ) : (
      <PlayerBar
        fen={shownFen}
        color={c}
        initials={bot.initials}
        photo={bot.photo}
        name={bot.name}
        active={thinking && turn !== s.color}
        sub={thinking && turn !== s.color ? <span>{t('pc.thinking')}</span> : null}
      />
    )

  let outcome: { title: string; text?: string; tone: 'win' | 'lose' | 'draw' } | null = null
  if (s.resigned) outcome = { title: t('pc.resignedTitle'), text: t('pc.resignedText'), tone: 'lose' }
  else if (result.over)
    outcome =
      result.winner === null
        ? { title: t('pc.drawTitle'), text: result.text, tone: 'draw' }
        : result.winner === s.color
          ? { title: t('pc.winTitle'), text: t('pc.winText', { n: Math.ceil(s.moves.length / 2) }) + (s.hints ? t('pc.winHints', { hints: s.hints }) : '') + '.', tone: 'win' }
          : { title: t('pc.loseTitle', { bot: bot.name }), text: t('pc.loseText'), tone: 'lose' }

  const actions = (
    <div className="grid grid-cols-3 gap-2">
      <Button variant="soft" onClick={askHint} disabled={!live || !userTurn || thinking}>
        <Icon name="bulb" /> {t('pc.hint')}
      </Button>
      <Button variant="soft" onClick={() => setFlipped((f) => !f)}>
        <Icon name="flip" /> {t('pc.flip')}
      </Button>
      <ConfirmButton icon="flag" label={t('pc.resign')} confirm={t('pc.resignConfirm')} disabled={over} onConfirm={() => setS((cur) => ({ ...cur, resigned: true }))} />
    </div>
  )
  const historyNav = (
    <>
      {!live && <ReviewBanner ply={shownPly} total={s.moves.length} onLatest={() => setBack(0)} />}
      <HistoryNav ply={shownPly} total={s.moves.length} onJump={(p) => setBack(s.moves.length - p)} />
    </>
  )
  const statusLine = (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm" aria-live="polite">
      <span>{outcome ? <strong className="text-gold">{outcome.title}</strong> : thinking && turn !== s.color ? t('pc.engineThinking') : userTurn ? t('pc.yourTurn') : '…'}</span>
      {outcome && (
        <Button onClick={start} className="px-3 py-1.5">
          <Icon name="reset" className="h-4 w-4" /> {t('pc.rematch')}
        </Button>
      )}
    </div>
  )
  const fsExtras = (
    <>
      {statusLine}
      {historyNav}
      {actions}
    </>
  )

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,1fr)] lg:gap-8">
      <BoardStage fsExtras={fsExtras} fsReserve={18.5}>
        {bar(top)}
        <ChessBoard fen={shownFen} orientation={orientation} movable={live && userTurn ? s.color : false} onMove={onMove} lastMove={shownLast} arrows={live && hint ? [hint] : undefined} shake={shake} />
        {bar(top === 'w' ? 'b' : 'w')}
      </BoardStage>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{level.name}</Badge>
          <Badge tone="muted">{t('pc.playingAs', { color: s.color === 'w' ? t('pc.white') : t('pc.black') })}</Badge>
          {(view ? view.game.inCheck() : game.inCheck()) && !over && <Badge tone="danger">{t('pc.checkBadge')}</Badge>}
        </div>

        {engineError && (
          <div role="alert" className="rounded-2xl border border-danger/50 bg-danger/10 p-4 text-sm">
            {t('pc.engineFail')}
          </div>
        )}

        {(botSays || coach) && (
          <div className="flex flex-col gap-2">
            {botSays && (
              <p key={`b-${botSays}`} className="animate-bubble flex items-start gap-2 text-sm">
                <BotAvatar bot={bot} className="h-8 w-8 text-[0.65rem]" />
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
              <Icon name="reset" /> {t('pc.rematch')}
            </Button>
            {s.moves.length >= 4 && (
              <Button variant="soft" onClick={() => setAnalyze(true)} disabled={analyze}>
                <Icon name="cpu" /> {t('pc.analyze')}
              </Button>
            )}
            {outcome.tone === 'win' && <ShareButton text={t('pc.shareText', { bot: bot.name, level: level.id, n: Math.ceil(s.moves.length / 2) })} path="/play/computer/" />}
            <Button variant="soft" onClick={() => setS((cur) => ({ ...cur, started: false }))}>
              {t('pc.changeLevel')}
            </Button>
          </ResultCard>
        ) : (
          <p className="rounded-xl border border-line bg-surface p-3 text-sm" aria-live="polite">
            {thinking && turn !== s.color ? t('pc.engineThinking') : userTurn ? (s.moves.length === 0 ? t('pc.firstMove') : t('pc.yourTurn')) : '…'}
            {evalText && <span className="ms-2 text-muted">{t('pc.evalLabel')}<bdi className="font-bold text-gold">{evalText}</bdi></span>}
          </p>
        )}

        {historyNav}

        {actions}

        {analyze && <Analysis moves={s.moves} userColor={s.color} />}

        <MoveList sans={sans} ply={shownPly} onPick={(p) => setBack(s.moves.length - p)} />

        <div className="flex flex-wrap gap-2">
          <ConfirmButton icon="reset" label={t('pc.newGameBtn')} confirm={t('pc.newGameConfirm')} disabled={s.moves.length === 0 && !over} onConfirm={start} />
          <Button variant="ghost" onClick={() => setS((cur) => ({ ...cur, started: false }))}>
            {t('pc.changeLevelOrColor')}
          </Button>
        </div>
      </div>
    </div>
  )
}
