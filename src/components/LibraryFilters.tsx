'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { useProgress } from '../lib/progress'

type Opt = { v: string; label: string }

/** filter state kept in sessionStorage, so search and filters survive moving between pages and Back */
export function usePersisted(list: string, name: string, initial: string) {
  const key = `chesti-filters:${list}:${name}`
  const [value, setValue] = useState(initial)
  const ready = useRef(false)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(key)
      if (saved !== null) setValue(saved)
    } catch {
      // storage blocked: filters just won't persist
    }
    ready.current = true
  }, [key])
  useEffect(() => {
    if (!ready.current) return
    try {
      if (value === initial) sessionStorage.removeItem(key)
      else sessionStorage.setItem(key, value)
    } catch {
      // storage blocked: filters just won't persist
    }
  }, [key, value, initial])
  return [value, setValue] as const
}

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

/** compact search bar + a filters icon toggle; the filter rows stay collapsed until needed */
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
          aria-label={t('lb.filters')}
          title={t('lb.filters')}
          className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition ${
            open || active ? 'border-gold bg-gold-soft text-gold' : 'border-line text-muted hover:border-gold/40 hover:text-ink'
          }`}
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 5h18l-7 8.5V20l-4-2v-4.5L3 5z" />
          </svg>
          {active > 0 && <span className="absolute -end-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-xs font-bold text-[#1a1408]">{active}</span>}
        </button>
      </div>
      {open && <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">{children}</div>}
      <p className="mt-2 px-1 text-xs text-muted" aria-live="polite">
        {t('lb.showingPre')}<strong className="text-gold">{shown}</strong>{t('lb.showingPost', { total })}
      </p>
    </div>
  )
}
