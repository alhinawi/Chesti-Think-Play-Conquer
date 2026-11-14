'use client'

import ChessBoard from './ChessBoard'
import { Button, Icon } from './ui'
import { BOARD_THEMES, useSettings, type Settings } from '../lib/settings'
import { useProgress } from '../lib/progress'
import { ALL_LESSONS as LESSONS } from '../data/lessons'
import { PUZZLES } from '../data/puzzles'
import { TRAPS } from '../data/traps'

const PREVIEW = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4'

function Toggle({ k, label, hint }: { k: keyof Settings; label: string; hint?: string }) {
  const { settings, update } = useSettings()
  const on = settings[k] as boolean
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-line py-3 last:border-0">
      <span>
        <span className="block font-bold">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" className="h-5 w-5 accent-[var(--gold)]" checked={on} onChange={(e) => update({ [k]: e.target.checked } as Partial<Settings>)} />
    </label>
  )
}

export default function SettingsPanel() {
  const { settings, update } = useSettings()
  const progress = useProgress()
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-6">
        <section aria-labelledby="s-look" className="luxe-card rounded-2xl p-5">
          <h2 id="s-look" className="mb-3 text-lg font-bold">الشكل</h2>
          <div role="radiogroup" aria-label="الوضع" className="mb-4 grid grid-cols-2 gap-2">
            {(
              [
                ['dark', 'غامق', 'moon'],
                ['light', 'فاتح', 'sun'],
              ] as const
            ).map(([v, label, icon]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={settings.theme === v}
                onClick={() => update({ theme: v })}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold ${settings.theme === v ? 'border-gold bg-gold-soft text-gold' : 'border-line text-muted hover:border-gold/50'}`}
              >
                <Icon name={icon} className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          <p className="mb-2 text-sm font-bold">لون الرقعة</p>
          <div role="radiogroup" aria-label="لون الرقعة" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {BOARD_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={settings.board === t.id}
                onClick={() => update({ board: t.id })}
                className={`rounded-xl border p-2 text-xs font-bold ${settings.board === t.id ? 'border-gold bg-gold-soft text-gold' : 'border-line text-muted hover:border-gold/50'}`}
              >
                <span className="mx-auto mb-1 grid h-9 w-9 grid-cols-2 overflow-hidden rounded-md" style={{ outline: `2px solid ${t.frame}` }} aria-hidden>
                  <span style={{ background: t.light }} />
                  <span style={{ background: t.dark }} />
                  <span style={{ background: t.dark }} />
                  <span style={{ background: t.light }} />
                </span>
                {t.name}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="s-board" className="luxe-card rounded-2xl px-5 py-2">
          <h2 id="s-board" className="pt-3 text-lg font-bold">الرقعة والصوت</h2>
          <Toggle k="sound" label="الصوت" hint="صوت النقلة والأكل والكش" />
          <Toggle k="coords" label="أسماء الخانات" hint="الحروف والأرقام على طرف الرقعة" />
          <Toggle k="legalDots" label="ورّيني القطعة تقدر تروح فين" hint="نقط على الخانات المسموحة لما تختار قطعة" />
          <Toggle k="animations" label="حركة القطع" />
        </section>

        <section aria-labelledby="s-progress" className="luxe-card rounded-2xl p-5">
          <h2 id="s-progress" className="text-lg font-bold">تقدمك</h2>
          <p className="mt-1 text-sm text-muted">متسجل على الجهاز ده بس، من غير حساب.</p>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            {(
              [
                ['دروس', progress.lessons.length, LESSONS.length],
                ['ألغاز', progress.puzzles.length, PUZZLES.length],
                ['فخاخ', progress.traps.length, TRAPS.length],
              ] as const
            ).map(([label, n, total]) => (
              <div key={label} className="rounded-xl border border-line bg-surface p-3">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="ltr text-lg font-bold">
                  {n}<span className="text-sm text-muted">/{total}</span>
                </dd>
              </div>
            ))}
          </dl>
          <Button
            variant="ghost"
            className="mt-3 text-danger"
            onClick={() => {
              if (window.confirm('تمسح كل تقدمك؟ مش هتقدر ترجعه.')) progress.reset()
            }}
          >
            <Icon name="reset" className="h-4 w-4" /> امسح التقدم
          </Button>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24">
        <p className="mb-2 text-sm font-bold text-muted">شكل الرقعة</p>
        <ChessBoard fen={PREVIEW} movable="both" />
      </aside>
    </div>
  )
}
