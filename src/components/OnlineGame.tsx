'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import BoardStage from './BoardStage'
import ChessBoard from './ChessBoard'
import { ConfirmButton, MoveList, PlayerBar, ResultCard } from './GameParts'
import { Badge, Button, Icon } from './ui'
import { gameResult, soundFor, toUci, type UciMove } from '../lib/chess'
import { useI18n } from '../lib/i18n'
import { resultText } from '../lib/i18n/resultText'
import { playUci } from '../lib/game'
import { assignSeat, makeRoomCode, mergeGame, mergeSeats, newGame, normalizeRoomCode, onlineEnabled, type Color, type OnlineGame as Game, type Seats } from '../lib/online'
import { play } from '../lib/sound'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const ENABLED = onlineEnabled(SB_URL, SB_KEY)

interface RoomState {
  seats: Seats
  game: Game
}

const roomKey = (code: string) => `chesti-room-${code}`

function playerId() {
  let id = localStorage.getItem('chesti-player-id')
  if (!id) {
    id = makeRoomCode(Math.random, 10)
    localStorage.setItem('chesti-player-id', id)
  }
  return id
}

function loadRoom(code: string): RoomState | null {
  try {
    const r = JSON.parse(localStorage.getItem(roomKey(code)) || 'null')
    return r && r.game && r.seats ? r : null
  } catch {
    return null
  }
}

function setUrlRoom(code: string | null) {
  const u = new URL(window.location.href)
  if (code) u.searchParams.set('room', code)
  else u.searchParams.delete('room')
  window.history.replaceState(null, '', u.toString())
}

const same = (a: RoomState, b: RoomState) => JSON.stringify(a) === JSON.stringify(b)

export default function OnlineGame({ initialRoom, onLeave }: { initialRoom: string | null; onLeave: () => void }) {
  const { t } = useI18n()
  const [code, setCode] = useState<string | null>(initialRoom)
  const [joinInput, setJoinInput] = useState('')
  const [joinError, setJoinError] = useState('')
  const [hostColor, setHostColor] = useState<Color | 'random'>('w')

  useEffect(() => setCode(initialRoom), [initialRoom])

  if (!ENABLED) {
    return (
      <div className="luxe-card mx-auto max-w-xl rounded-2xl p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-gold-soft text-gold">
          <Icon name="globe" />
        </span>
        <h2 className="mt-3 text-lg font-bold">{t('og.offTitle')}</h2>
        <p className="mt-1 text-sm text-muted">{t('og.offDesc')}</p>
      </div>
    )
  }

  if (code) {
    return (
      <Room
        key={code}
        code={code}
        onLeave={() => {
          setUrlRoom(null)
          setCode(null)
          onLeave()
        }}
      />
    )
  }

  function create() {
    const c = makeRoomCode()
    const color: Color = hostColor === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : hostColor
    const state: RoomState = { seats: { [playerId()]: color }, game: newGame() }
    localStorage.setItem(roomKey(c), JSON.stringify(state))
    setUrlRoom(c)
    setCode(c)
  }

  function join() {
    const raw = joinInput.includes('room=') ? new URL(joinInput, window.location.href).searchParams.get('room') : joinInput
    const c = normalizeRoomCode(raw)
    if (!c) {
      setJoinError(t('og.badCode'))
      return
    }
    setUrlRoom(c)
    setCode(c)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="luxe-card rounded-2xl p-5" aria-labelledby="create-room">
        <h2 id="create-room" className="text-lg font-bold">{t('og.createTitle')}</h2>
        <p className="mt-1 text-sm text-muted">{t('og.createDesc')}</p>
        <div role="radiogroup" aria-label={t('og.yourColor')} className="mt-4 grid grid-cols-3 gap-2">
          {(
            [
              ['w', t('og.white')],
              ['random', t('og.random')],
              ['b', t('og.black')],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={hostColor === v}
              onClick={() => setHostColor(v)}
              className={`rounded-xl border px-2 py-2 text-sm font-bold ${hostColor === v ? 'border-gold bg-gold-soft text-gold' : 'border-line text-muted hover:border-gold/50'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <Button onClick={create} className="mt-4 w-full">
          <Icon name="share" /> {t('og.createBtn')}
        </Button>
      </section>

      <section className="luxe-card rounded-2xl p-5" aria-labelledby="join-room">
        <h2 id="join-room" className="text-lg font-bold">{t('og.joinTitle')}</h2>
        <p className="mt-1 text-sm text-muted">{t('og.joinDesc')}</p>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            join()
          }}
        >
          <label htmlFor="room-code" className="sr-only">{t('og.roomCode')}</label>
          <input
            id="room-code"
            dir="ltr"
            value={joinInput}
            onChange={(e) => {
              setJoinInput(e.target.value)
              setJoinError('')
            }}
            placeholder="K7MQ2D"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2.5 text-center font-mono text-lg tracking-[0.3em] uppercase outline-none focus:border-gold"
          />
          <Button type="submit" disabled={!joinInput.trim()}>
            {t('og.joinBtn')}
          </Button>
        </form>
        {joinError && <p role="alert" className="mt-2 text-sm text-danger">{joinError}</p>}
      </section>
    </div>
  )
}

function Room({ code, onLeave }: { code: string; onLeave: () => void }) {
  const { t } = useI18n()
  const sideName = (c: Color) => t(c === 'w' ? 'rs.white' : 'rs.black')
  const [me, setMe] = useState('')
  const [state, setState] = useState<RoomState | null>(null)
  const [status, setStatus] = useState<'connecting' | 'online' | 'error'>('connecting')
  const [peers, setPeers] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [shake, setShake] = useState(0)
  const stateRef = useRef<RoomState | null>(null)
  const chRef = useRef<RealtimeChannel | null>(null)

  const commit = useCallback(
    (next: RoomState, broadcast: boolean) => {
      stateRef.current = next
      setState(next)
      localStorage.setItem(roomKey(code), JSON.stringify(next))
      if (broadcast) void chRef.current?.send({ type: 'broadcast', event: 'state', payload: next })
    },
    [code],
  )

  useEffect(() => {
    const id = playerId()
    setMe(id)
    // a newcomer starts with no seat and an "empty" game that loses to any real one
    const initial = loadRoom(code) ?? { seats: {}, game: { ...newGame(), startedAt: 0 } }
    stateRef.current = initial
    setState(initial)

    let client: SupabaseClient | null = null
    let cancelled = false
    ;(async () => {
      const { createClient } = await import('@supabase/supabase-js')
      if (cancelled) return
      client = createClient(SB_URL!, SB_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
      const ch = client.channel(`chesti-room-${code}`, { config: { broadcast: { self: false }, presence: { key: id } } })
      chRef.current = ch
      ch.on('broadcast', { event: 'state' }, ({ payload }) => {
        const local = stateRef.current
        const remote = payload as RoomState
        if (!local || !remote?.game || !remote?.seats) return
        const merged: RoomState = { seats: mergeSeats(local.seats, remote.seats), game: mergeGame(local.game, remote.game) }
        commit(merged, !same(merged, remote))
      })
      ch.on('broadcast', { event: 'hello' }, ({ payload }) => {
        const local = stateRef.current
        const who = (payload as { id?: string })?.id
        if (!local || !who) return
        // only someone who already sits in the room hands out the free seat
        const seats = local.seats[id] ? assignSeat(local.seats, who) : local.seats
        commit({ ...local, seats }, true)
      })
      ch.on('presence', { event: 'sync' }, () => setPeers(Object.keys(ch.presenceState())))
      ch.subscribe(async (st) => {
        if (cancelled) return
        if (st === 'SUBSCRIBED') {
          setStatus('online')
          await ch.track({ at: Date.now() })
          await ch.send({ type: 'broadcast', event: 'hello', payload: { id } })
          if (stateRef.current) await ch.send({ type: 'broadcast', event: 'state', payload: stateRef.current })
        } else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') setStatus('error')
        else if (st === 'CLOSED') setStatus('connecting')
      })
    })().catch(() => setStatus('error'))

    return () => {
      cancelled = true
      const ch = chRef.current
      chRef.current = null
      if (ch && client) void client.removeChannel(ch)
    }
  }, [code, commit])

  const moves = state?.game.moves
  const { game, sans, lastMove } = useMemo(() => playUci(moves ?? []), [moves])

  const prevLen = useRef<number | null>(null)
  useEffect(() => {
    const n = moves?.length ?? 0
    if (prevLen.current !== null && n > prevLen.current) {
      const last = game.history({ verbose: true }).at(-1)
      if (last) soundFor(last, game)
    }
    prevLen.current = n
  }, [moves?.length, game, moves])

  if (!state || !me) return <div className="h-96 animate-pulse rounded-2xl bg-surface" />

  const myColor: Color | undefined = state.seats[me]
  const seatedIds = Object.keys(state.seats)
  const opponentId = seatedIds.find((x) => x !== me)
  const opponentHere = !!opponentId && peers.includes(opponentId)
  const spectator = !myColor && seatedIds.length >= 2
  const waitingForSeat = !myColor && !spectator
  const fen = game.fen()
  const turn = game.turn()
  const result = gameResult(game)
  const over = result.over || !!state.game.resigned
  const myTurn = !!myColor && !over && turn === myColor
  const link = typeof window !== 'undefined' ? `${window.location.origin}/play/friend/?room=${code}` : ''

  function onMove(m: UciMove) {
    const cur = stateRef.current
    if (!cur || !myTurn) return false
    const uci = toUci(m)
    const r = playUci([...cur.game.moves, uci])
    if (r.moves.length !== cur.game.moves.length + 1) {
      setShake((x) => x + 1)
      play('error')
      return false
    }
    commit({ ...cur, game: { ...cur.game, moves: [...cur.game.moves, uci] } }, true)
    return true
  }

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: t('og.shareTitle'), text: t('og.shareText', { code }), url: link })
        return
      }
    } catch {
      /* user closed the share sheet; fall back to copying */
    }
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt(t('og.copyPrompt'), link)
    }
  }

  const orientation = myColor === 'b' ? 'black' : 'white'
  const top: Color = orientation === 'white' ? 'b' : 'w'
  const nameOf = (c: Color) => (myColor === c ? t('og.you') : myColor ? t('og.friend') : sideName(c))
  const subOf = (c: Color) =>
    myColor && c !== myColor ? <span className={opponentHere ? 'text-emerald' : ''}>{opponentHere ? t('og.here') : t('og.away')}</span> : null

  let outcome: { title: string; text?: string; tone: 'win' | 'lose' | 'draw' } | null = null
  if (state.game.resigned) {
    const winner: Color = state.game.resigned === 'w' ? 'b' : 'w'
    outcome = { title: myColor ? (winner === myColor ? t('og.youWonResign') : t('og.youResigned')) : t('og.sideWon', { side: sideName(winner) }), tone: myColor ? (winner === myColor ? 'win' : 'lose') : 'draw' }
  } else if (result.over) {
    if (!result.winner) outcome = { title: t('og.draw'), text: resultText(t, result), tone: 'draw' }
    else outcome = { title: myColor ? (result.winner === myColor ? t('og.youWon') : t('og.friendWon')) : t('og.sideWon', { side: sideName(result.winner) }), text: resultText(t, result), tone: myColor ? (result.winner === myColor ? 'win' : 'lose') : 'draw' }
  }

  const rematch = () => stateRef.current && commit({ ...stateRef.current, game: newGame() }, true)
  const fsExtras = (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm" aria-live="polite">
      <span>{outcome ? <strong className="text-gold">{outcome.title}</strong> : myColor ? (myTurn ? t('og.yourTurn') : t('og.friendTurn')) : t('og.turnOn', { side: sideName(turn) })}</span>
      {outcome && myColor && (
        <Button onClick={rematch} className="px-3 py-1.5">
          <Icon name="reset" className="h-4 w-4" /> {t('og.rematch')}
        </Button>
      )}
      {!outcome && myColor && (
        <ConfirmButton
          icon="flag"
          label={t('og.resign')}
          confirm={t('og.resignConfirm')}
          disabled={over}
          onConfirm={() => stateRef.current && myColor && commit({ ...stateRef.current, game: { ...stateRef.current.game, resigned: myColor } }, true)}
        />
      )}
    </div>
  )

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,1fr)] lg:gap-8">
      <BoardStage fsExtras={fsExtras} reserve={15} fsReserve={11}>
        <PlayerBar fen={fen} color={top} name={nameOf(top)} sub={subOf(top)} active={!over && turn === top} />
        <ChessBoard fen={fen} orientation={orientation} movable={myTurn ? myColor : false} onMove={onMove} lastMove={lastMove} shake={shake} />
        <PlayerBar fen={fen} color={top === 'w' ? 'b' : 'w'} name={nameOf(top === 'w' ? 'b' : 'w')} sub={subOf(top === 'w' ? 'b' : 'w')} active={!over && turn !== top} />
      </BoardStage>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="muted">
            {t('og.room')} <bdi className="ms-1 font-mono tracking-widest">{code}</bdi>
          </Badge>
          {status === 'online' ? <Badge tone="emerald">{t('og.online')}</Badge> : status === 'error' ? <Badge tone="danger">{t('og.offline')}</Badge> : <Badge tone="muted">{t('og.connecting')}</Badge>}
          {myColor && <Badge>{t('og.playingAs', { side: sideName(myColor) })}</Badge>}
          {spectator && <Badge tone="muted">{t('og.spectating')}</Badge>}
        </div>

        {status === 'error' && (
          <div role="alert" className="rounded-2xl border border-danger/50 bg-danger/10 p-4 text-sm">
            {t('og.connErr')}
          </div>
        )}

        {myColor && !opponentHere && status === 'online' && state.game.moves.length === 0 && (
          <div className="rounded-2xl border border-gold/40 bg-gold-soft p-4">
            <p className="font-bold text-gold">{t('og.waitTitle')}</p>
            <p className="mt-1 text-sm">{t('og.waitDescPre')}<bdi className="font-mono font-bold tracking-widest">{code}</bdi></p>
            <p dir="ltr" className="mt-2 truncate rounded-lg bg-bg px-2 py-1 text-center font-mono text-xs text-muted">{link}</p>
          </div>
        )}
        {waitingForSeat && status === 'online' && <p className="rounded-xl border border-line bg-surface p-3 text-sm">{t('og.seating')}</p>}
        {spectator && <p className="rounded-xl border border-line bg-surface p-3 text-sm">{t('og.full')}</p>}

        {outcome ? (
          <ResultCard {...outcome}>
            {myColor && (
              <Button onClick={() => stateRef.current && commit({ ...stateRef.current, game: newGame() }, true)}>
                <Icon name="reset" /> {t('og.rematch')}
              </Button>
            )}
          </ResultCard>
        ) : (
          myColor && (
            <p className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3 text-sm" aria-live="polite">
              {myTurn ? t('og.yourTurn') : t('og.friendTurn')}
              {game.inCheck() && <Badge tone="danger">{t('og.check')}</Badge>}
            </p>
          )
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="soft" onClick={share}>
            <Icon name={copied ? 'check' : 'share'} /> {copied ? t('og.copied') : t('og.shareLink')}
          </Button>
          <ConfirmButton
            icon="flag"
            label={t('og.resign')}
            confirm={t('og.resignConfirm')}
            disabled={!myColor || over}
            onConfirm={() => stateRef.current && myColor && commit({ ...stateRef.current, game: { ...stateRef.current.game, resigned: myColor } }, true)}
          />
        </div>

        <MoveList sans={sans} />

        <Button variant="ghost" onClick={onLeave} className="self-start">
          <Icon name="x" /> {t('og.leave')}
        </Button>
      </div>
    </div>
  )
}
