'use client'

import type { ReactNode } from 'react'
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

export const PROGRESS_OPTS: Opt[] = [
  { v: 'all', label: 'الكل' },
  { v: 'new', label: 'لسه ماشفتوش' },
  { v: 'done', label: 'خلصته' },
]
export const SIDE_OPTS: Opt[] = [
  { v: 'all', label: 'الكل' },
  { v: 'w', label: 'الأبيض' },
  { v: 'b', label: 'الأسود' },
]
export const LEVEL_OPTS: Opt[] = [
  { v: 'all', label: 'الكل' },
  { v: 'سهل', label: 'سهل' },
  { v: 'متوسط', label: 'متوسط' },
  { v: 'متقدم', label: 'متقدم' },
]

/** is this item finished? progress lists get filled when a viewer reaches the last move */
export function useDone(kind: 'traps' | 'openings' | 'miniatures') {
  const p = useProgress()
  return (id: string) => (p[kind] ?? []).includes(id)
}

export function matchesProgress(prog: string, done: boolean) {
  return prog === 'all' || (prog === 'done' ? done : !done)
}

/** search box + result count + the chip rows, in one card above a library grid */
export function FilterCard({ q, setQ, shown, total, children }: { q: string; setQ: (v: string) => void; shown: number; total: number; children: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <div className="relative">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="دوّر بالاسم، عربي أو إنجليزي…"
          aria-label="دوّر بالاسم"
          className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-gold"
        />
      </div>
      {children}
      <p className="text-xs text-muted" aria-live="polite">
        بيبين <strong className="text-gold">{shown}</strong> من {total}
      </p>
    </div>
  )
}
