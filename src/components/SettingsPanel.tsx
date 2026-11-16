'use client'

import ChessBoard from './ChessBoard'
import { Button, Icon } from './ui'
import { BOARD_THEMES, useSettings, type Settings } from '../lib/settings'
import { SOUND_PACKS, play } from '../lib/sound'
import { useProgress } from '../lib/progress'
import { ALL_LESSONS as LESSONS } from '../data/lessons'
import { PUZZLES } from '../data/puzzles'
import { TRAPS } from '../data/traps'
import { useI18n } from '../lib/i18n'

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
  const { t: i18n, locale, setLocale, locales } = useI18n()
  const cap = (x: string) => x[0].toUpperCase() + x.slice(1)
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-6">
        <section aria-labelledby="s-look" className="luxe-card rounded-2xl p-5">
          <h2 id="s-look" className="mb-3 text-lg font-bold">{i18n('st.look')}</h2>
          <div role="radiogroup" aria-label={i18n('st.mode')} className="mb-4 grid grid-cols-2 gap-2">
            {(
              [
                ['dark', i18n('st.dark'), 'moon'],
                ['light', i18n('st.light'), 'sun'],
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
          <p className="mb-2 text-sm font-bold">{i18n('st.boardColor')}</p>
          <div role="radiogroup" aria-label={i18n('st.boardColor')} className="grid grid-cols-3 gap-2 sm:grid-cols-5">
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
                {i18n(`st.board${cap(t.id)}`)}
              </button>
            ))}
          </div>
          <div className="mt-4 lg:hidden">
            <p className="mb-2 text-sm font-bold text-muted">{i18n('st.boardPreview')}</p>
            <ChessBoard fen={PREVIEW} movable="both" />
          </div>
        </section>

        <section aria-labelledby="s-lang" className="luxe-card rounded-2xl p-5">
          <h2 id="s-lang" className="mb-3 text-lg font-bold">{i18n('st.language')}</h2>
          <div role="radiogroup" aria-label={i18n('st.language')} className="grid grid-cols-2 gap-2">
            {locales.map((l) => (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={locale === l.id}
                onClick={() => setLocale(l.id)}
                className={`rounded-xl border py-2.5 text-sm font-bold ${locale === l.id ? 'border-gold bg-gold-soft text-gold' : 'border-line text-muted hover:border-gold/50'}`}
              >
                {l.native}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="s-board" className="luxe-card rounded-2xl px-5 py-2">
          <h2 id="s-board" className="pt-3 text-lg font-bold">{i18n('st.boardSound')}</h2>
          <Toggle k="sound" label={i18n('st.sound')} hint={i18n('st.soundHint')} />
          <Toggle k="coords" label={i18n('st.coords')} hint={i18n('st.coordsHint')} />
          <Toggle k="legalDots" label={i18n('st.legalDots')} hint={i18n('st.legalDotsHint')} />
          <Toggle k="animations" label={i18n('st.animations')} />
        </section>

        <section aria-labelledby="s-sounds" className="luxe-card rounded-2xl p-5">
          <h2 id="s-sounds" className="mb-1 text-lg font-bold">{i18n('st.packTitle')}</h2>
          <p className="mb-3 text-sm text-muted">{i18n('st.packDesc')}</p>
          <div role="radiogroup" aria-label={i18n('st.packTitle')} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SOUND_PACKS.map((pk) => (
              <button
                key={pk.id}
                type="button"
                role="radio"
                aria-checked={settings.soundPack === pk.id}
                onClick={() => {
                  update({ soundPack: pk.id, sound: true })
                  setTimeout(() => {
                    play('move')
                    setTimeout(() => play('capture'), 220)
                  }, 30)
                }}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold ${settings.soundPack === pk.id ? 'border-gold bg-gold-soft text-gold' : 'border-line text-muted hover:border-gold/50'}`}
              >
                {i18n(`st.pack${cap(pk.id)}`)}
                <Icon name="sound" className="h-4 w-4" />
              </button>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-3">
            <span className="text-sm font-bold">{i18n('st.volume')}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={settings.soundVolume}
              aria-label={i18n('st.volume')}
              onChange={(e) => update({ soundVolume: Number(e.target.value) })}
              onMouseUp={() => play('move')}
              onTouchEnd={() => play('move')}
              className="w-full accent-[var(--gold)]"
            />
            <span className="ltr w-10 text-center text-sm text-muted">{settings.soundVolume}%</span>
          </label>
        </section>

        <section aria-labelledby="s-progress" className="luxe-card rounded-2xl p-5">
          <h2 id="s-progress" className="text-lg font-bold">{i18n('st.progress')}</h2>
          <p className="mt-1 text-sm text-muted">{i18n('st.progressNote')}</p>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            {(
              [
                [i18n('st.lessons'), progress.lessons.length, LESSONS.length],
                [i18n('st.puzzles'), progress.puzzles.length, PUZZLES.length],
                [i18n('st.traps'), progress.traps.length, TRAPS.length],
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
              if (window.confirm(i18n('st.confirmReset'))) progress.reset()
            }}
          >
            <Icon name="reset" className="h-4 w-4" /> {i18n('st.reset')}
          </Button>
        </section>
      </div>

      <aside className="hidden lg:sticky lg:top-24 lg:block">
        <p className="mb-2 text-sm font-bold text-muted">{i18n('st.boardPreview')}</p>
        <ChessBoard fen={PREVIEW} movable="both" />
      </aside>
    </div>
  )
}
