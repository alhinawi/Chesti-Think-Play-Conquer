'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { material, movePairs, PIECE_VALUE } from '../lib/game'
import { Button, Icon } from './ui'

const GLYPH: Record<string, string> = { q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }

/** Name + captured pieces + material lead, shown above and below the board. */
export function PlayerBar({
  fen,
  color,
  name,
  sub,
  active,
  icon,
  initials,
  photo,
}: {
  fen: string
  color: 'w' | 'b'
  name: string
  sub?: ReactNode
  active?: boolean
  icon?: string
  initials?: string
  photo?: string
}) {
  const m = material(fen)
  const caps = m.capturedBy[color]
  const lead = color === 'w' ? m.diff : -m.diff
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition ${active ? 'border-gold/60 bg-gold-soft' : 'border-line bg-surface'}`}>
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg ${color === 'w' ? 'bg-[#f2eadb] text-[#1a1408]' : 'bg-[#1a1814] text-[#f2eadb] ring-1 ring-white/15'}`}
        aria-hidden
      >
        {photo ? <img src={photo} alt="" className="h-full w-full rounded-lg object-cover" /> : initials ? <span className="text-xs font-bold">{initials}</span> : icon ? <Icon name={icon} className="h-5 w-5" /> : color === 'w' ? '♔' : '♚'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">
          {name}
          {active && <span className="ms-2 inline-block h-2 w-2 animate-pulse rounded-full bg-gold align-middle" aria-label="عليه الدور" />}
        </p>
        <p className="flex min-h-5 items-center gap-1 text-xs text-muted">
          {sub}
          <span className="ltr text-base leading-none tracking-tighter text-muted" aria-label={caps.length ? `أكل ${caps.length} قطع` : undefined}>
            {caps
              .slice()
              .sort((a, b) => PIECE_VALUE[b] - PIECE_VALUE[a])
              .map((p) => GLYPH[p])
              .join('')}
          </span>
          {lead > 0 && <span className="ltr font-bold text-gold">+{lead}</span>}
        </p>
      </div>
    </div>
  )
}


/** chess.com-style history navigation: first / back / forward / latest. ply = viewed ply, total = played plies. */
export function HistoryNav({ ply, total, onJump }: { ply: number; total: number; onJump: (ply: number) => void }) {
  const cls = 'px-0'
  return (
    <div className="grid grid-cols-4 gap-2" role="group" aria-label="تصفّح نقلات الدور">
      <Button variant="soft" className={cls} onClick={() => onJump(0)} disabled={ply === 0} aria-label="أول نقلة">
        <Icon name="first" />
      </Button>
      <Button variant="soft" className={cls} onClick={() => onJump(ply - 1)} disabled={ply === 0} aria-label="النقلة اللي قبلها">
        <Icon name="prev" />
      </Button>
      <Button variant="soft" className={cls} onClick={() => onJump(ply + 1)} disabled={ply >= total} aria-label="النقلة اللي بعدها">
        <Icon name="next" />
      </Button>
      <Button variant="soft" className={cls} onClick={() => onJump(total)} disabled={ply >= total} aria-label="آخر نقلة">
        <Icon name="last" />
      </Button>
    </div>
  )
}

/** Banner shown while reviewing an old position: the board is locked until back at the latest move. */
export function ReviewBanner({ ply, total, onLatest }: { ply: number; total: number; onLatest: () => void }) {
  return (
    <p className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/40 bg-gold-soft px-3 py-2 text-sm" role="status">
      <span>
        بتشوف نقلة قديمة (<bdi className="font-bold">{ply} من {total}</bdi>) — ومش هتقدر تلعب غير لما ترجع لآخر نقلة.
      </span>
      <Button variant="outline" className="px-3 py-1.5" onClick={onLatest}>
        <Icon name="last" className="h-4 w-4" /> آخر نقلة
      </Button>
    </p>
  )
}

export function MoveList({ sans, ply, onPick }: { sans: string[]; ply?: number; onPick?: (ply: number) => void }) {
  const ref = useRef<HTMLOListElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [sans.length])
  if (!sans.length) return <p className="rounded-xl border border-dashed border-line p-3 text-center text-sm text-muted">لسه مفيش نقلات.</p>
  const current = ply ?? sans.length
  return (
    <ol ref={ref} dir="ltr" aria-label="النقلات" className="no-scrollbar grid max-h-48 grid-cols-[2.5rem_1fr_1fr] gap-x-1 overflow-y-auto rounded-xl border border-line bg-surface p-2 text-sm lg:max-h-72">
      {movePairs(sans).map(([n, w, b]) => (
        <li key={n} className="contents">
          <span className="py-0.5 text-muted">{n}.</span>
          {[w, b].map((s, k) => {
            const idx = (n - 1) * 2 + k + 1
            if (!s) return <span key={k} />
            const on = idx === current
            return onPick ? (
              <button key={k} type="button" onClick={() => onPick(idx)} className={`rounded px-1.5 py-0.5 text-start font-bold ${on ? 'bg-gold text-[#1a1408]' : 'hover:bg-surface-2'}`}>
                {s}
              </button>
            ) : (
              <span key={k} className={`rounded px-1.5 py-0.5 font-bold ${on ? 'bg-gold-soft text-gold' : ''}`}>
                {s}
              </span>
            )
          })}
        </li>
      ))}
    </ol>
  )
}

export function ResultCard({ title, text, tone, children }: { title: string; text?: string; tone: 'win' | 'lose' | 'draw'; children?: ReactNode }) {
  const tones = {
    win: 'border-emerald/50 bg-emerald/10 text-emerald',
    lose: 'border-danger/50 bg-danger/10 text-danger',
    draw: 'border-gold/50 bg-gold-soft text-gold',
  }
  return (
    <div role="status" className={`animate-pop rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-lg font-bold">{title}</p>
      {text && <p className="text-sm text-ink">{text}</p>}
      {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

export function ConfirmButton({ label, confirm, onConfirm, icon, disabled }: { label: string; confirm: string; onConfirm: () => void; icon: string; disabled?: boolean }) {
  return (
    <Button
      variant="soft"
      disabled={disabled}
      onClick={() => {
        if (window.confirm(confirm)) onConfirm()
      }}
    >
      <Icon name={icon} /> {label}
    </Button>
  )
}
