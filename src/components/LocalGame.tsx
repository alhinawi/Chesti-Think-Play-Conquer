'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import BoardStage from './BoardStage'
import ChessBoard from './ChessBoard'
import { ConfirmButton, HistoryNav, MoveList, PlayerBar, ResultCard, ReviewBanner } from './GameParts'
import { Badge, Button, Icon } from './ui'
import { gameResult, soundFor, toUci, turnName, type UciMove } from '../lib/chess'
import { playUci } from '../lib/game'
import { play } from '../lib/sound'

const KEY = 'chesti-local-game'

interface Saved {
  moves: string[]
  autoFlip: boolean
  resigned: 'w' | 'b' | null
  draw: boolean
}
const FRESH: Saved = { moves: [], autoFlip: false, resigned: null, draw: false }

export default function LocalGame() {
  const [s, setS] = useState<Saved>(FRESH)
  const [loaded, setLoaded] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [shake, setShake] = useState(0)

  useEffect(() => {
    try {
      setS({ ...FRESH, ...JSON.parse(localStorage.getItem(KEY) || '{}') })
    } catch {
      /* keep the fresh game */
    }
    setLoaded(true)
  }, [])
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(s))
  }, [s, loaded])

  const { game, sans, lastMove } = useMemo(() => playUci(s.moves), [s.moves])
  // review mode: `back` = plies behind the live position (0 = live, chess.com style)
  const [back, setBack] = useState(0)
  useEffect(() => setBack(0), [s.moves.length])
  const live = back === 0
  const view = useMemo(() => (back > 0 ? playUci(s.moves.slice(0, Math.max(0, s.moves.length - back))) : null), [s.moves, back])
  const shownPly = s.moves.length - back
  const shownFen = view ? view.game.fen() : game.fen()
  const shownLast = view ? view.lastMove : lastMove
  const turn = game.turn()
  const result = gameResult(game)
  const over = result.over || !!s.resigned || s.draw

  const prevLen = useRef(0)
  useEffect(() => {
    if (loaded && s.moves.length > prevLen.current) {
      const last = game.history({ verbose: true }).at(-1)
      if (last) soundFor(last, game)
    }
    prevLen.current = s.moves.length
  }, [s.moves.length, game, loaded])

  function onMove(m: UciMove) {
    if (over || !live) return false
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

  const whiteBottom = s.autoFlip ? turn === 'w' : !flipped
  const orientation = whiteBottom ? 'white' : 'black'
  const top: 'w' | 'b' = whiteBottom ? 'b' : 'w'

  let outcome: { title: string; text?: string; tone: 'win' | 'draw' } | null = null
  if (s.resigned) outcome = { title: `${turnName(s.resigned === 'w' ? 'b' : 'w')} كسب`, text: `${turnName(s.resigned)} استسلم.`, tone: 'win' }
  else if (s.draw) outcome = { title: 'تعادل', text: 'اتفقتوا على التعادل.', tone: 'draw' }
  else if (result.over) outcome = { title: result.winner ? `${turnName(result.winner)} كسب` : 'تعادل', text: result.text, tone: result.winner ? 'win' : 'draw' }

  if (!loaded) return <div className="h-96 animate-pulse rounded-2xl bg-surface" />

  const actions = (
    <div className="grid grid-cols-3 gap-2">
      <Button variant="soft" onClick={() => setFlipped((f) => !f)} disabled={s.autoFlip}>
        <Icon name="flip" /> اقلب
      </Button>
      <ConfirmButton icon="handshake" label="تعادل" confirm="اتفقتوا على التعادل؟" disabled={over || s.moves.length === 0} onConfirm={() => setS((cur) => ({ ...cur, draw: true }))} />
      <ConfirmButton icon="flag" label={`${turnName(turn)} يستسلم`} confirm={`${turnName(turn)} هيستسلم؟`} disabled={over} onConfirm={() => setS((cur) => ({ ...cur, resigned: turn }))} />
    </div>
  )
  const historyNav = (
    <>
      {!live && <ReviewBanner ply={shownPly} total={s.moves.length} onLatest={() => setBack(0)} />}
      <HistoryNav ply={shownPly} total={s.moves.length} onJump={(p) => setBack(s.moves.length - p)} />
    </>
  )
  const fsExtras = (
    <>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm" aria-live="polite">
        <span>
          {outcome ? <strong className="text-gold">{outcome.title}</strong> : <>الدور على <strong className="text-gold">{turnName(turn)}</strong></>}
        </span>
        {outcome && (
          <Button onClick={() => setS((cur) => ({ ...FRESH, autoFlip: cur.autoFlip }))} className="px-3 py-1.5">
            <Icon name="reset" className="h-4 w-4" /> دور تاني
          </Button>
        )}
      </div>
      {historyNav}
      {actions}
    </>
  )

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,1fr)] lg:gap-8">
      <BoardStage fsExtras={fsExtras} fsReserve={18.5}>
        <PlayerBar fen={shownFen} color={top} name={turnName(top)} active={live && !over && turn === top} />
        <ChessBoard fen={shownFen} orientation={orientation} movable={over || !live ? false : 'both'} onMove={onMove} lastMove={shownLast} shake={shake} />
        <PlayerBar fen={shownFen} color={top === 'w' ? 'b' : 'w'} name={turnName(top === 'w' ? 'b' : 'w')} active={live && !over && turn !== top} />
      </BoardStage>

      <div className="flex min-w-0 flex-col gap-4">
        {outcome ? (
          <ResultCard {...outcome}>
            <Button onClick={() => setS((cur) => ({ ...FRESH, autoFlip: cur.autoFlip }))}>
              <Icon name="reset" /> دور تاني
            </Button>
          </ResultCard>
        ) : (
          <p className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3 text-sm" aria-live="polite">
            الدور على <strong className="text-gold">{turnName(turn)}</strong>
            {game.inCheck() && <Badge tone="danger">كش!</Badge>}
          </p>
        )}

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 text-sm">
          <span>
            <span className="block font-bold">اقلب الرقعة بعد كل نقلة</span>
            <span className="text-xs text-muted">عشان كل واحد يشوف قطعه من تحت لما تتبادلوا الموبايل</span>
          </span>
          <input type="checkbox" className="h-5 w-5 accent-[var(--gold)]" checked={s.autoFlip} onChange={(e) => setS((cur) => ({ ...cur, autoFlip: e.target.checked }))} />
        </label>

        {historyNav}

        {actions}

        <MoveList sans={sans} ply={shownPly} onPick={(p) => setBack(s.moves.length - p)} />

        <ConfirmButton icon="reset" label="دور جديد" confirm="تبدأوا دور جديد؟" disabled={s.moves.length === 0 && !over} onConfirm={() => setS((cur) => ({ ...FRESH, autoFlip: cur.autoFlip }))} />
      </div>
    </div>
  )
}
