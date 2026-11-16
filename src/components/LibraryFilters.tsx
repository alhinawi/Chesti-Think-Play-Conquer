'use client'

import { type ReactNode, useState } from 'react'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { useProgress } from '../lib/progress'

type Opt = { v: string; label: string }

/** row of chip buttons for one filter dimension */
export function ChipRow({ label, options, value, onChange }: { label: string; options: Opt[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-bold text-muted">{label}:</span>
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          aria-pressed={value === o.v}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
            value === o.v ? 'border-gold bg-gold-soft text-gold' : 'border-line text-muted hover:border-gold/40 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** small native select for long option lists */
export function FilterSelect({ label, options, value, onChange }: { label: string; options: Opt[]; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-bold text-muted">
      {label}:
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-line bg-bg px-2 py-1.5 text-xs font-bold text-ink outline-none focus:border-gold"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

type T = (k: string) => string
export const progressOpts = (t: T): Opt[] => [
  { v: 'all', label: t('lb.progAll') },
  { v: 'new', label: t('lb.progNew') },
  { v: 'done', label: t('lb.progDone') },
]
export const sideOpts = (t: T): Opt[] => [
  { v: 'all', label: t('lb.sideAll') },
  { v: 'w', label: t('lb.sideW') },
  { v: 'b', label: t('lb.sideB') },
]
export const levelOpts = (t: T): Opt[] => [
  { v: 'all', label: t('lb.lvlAll') },
  { v: 'سهل', label: t('lb.lvlEasy') },
  { v: 'متوسط', label: t('lb.lvlMid') },
  { v: 'متقدم', label: t('lb.lvlAdv') },
]

/** is this item finished? progress lists get filled when a viewer reaches the last move */
export function useDone(kind: 'traps' | 'openings' | 'miniatures') {
  const p = useProgress()
  const { status } = useAuth()
  return (id: string) => status === 'authed' && (p[kind] ?? []).includes(id)
}

export function matchesProgress(prog: string, done: boolean) {
  return prog === 'all' || (prog === 'done' ? done : !done)
}

/** compact search bar + a فلاتر toggle; the filter rows stay collapsed until needed */
export function FilterCard({ q, setQ, shown, total, active, children }: { q: string; setQ: (v: string) => void; shown: number; total: number; active: number; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { t } = useI18n()
  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-3">
      <div className="flex items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('lb.searchPh')}
          aria-label={t('lb.searchAria')}
          className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-gold"
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
            open || active ? 'border-gold bg-gold-soft text-gold' : 'border-line text-muted hover:border-gold/40 hover:text-ink'
          }`}
        >
          {t('lb.filters')}
          {active > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-xs font-bold text-[#1a1408]">{active}</span>}
          <span aria-hidden className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </button>
      </div>
      {open && <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">{children}</div>}
      <p className="mt-2 px-1 text-xs text-muted" aria-live="polite">
        {t('lb.showingPre')}<strong className="text-gold">{shown}</strong>{t('lb.showingPost', { total })}
      </p>
    </div>
  )
}
