'use client'

import { useEffect, useRef, useState } from 'react'
import { askHelper, type HelperTurn } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { Icon } from './ui'

/** In-site learning helper: a small chat for chess questions. Conversation lives in memory only. */
export default function HelperChat() {
  const { t, locale, dir } = useI18n()
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState<HelperTurn[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const lang = locale === 'en' ? 'en' : 'eg'

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [turns, busy, open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function send(q: string) {
    const question = q.trim()
    if (!question || busy) return
    const next: HelperTurn[] = [...turns, { role: 'user', content: question }]
    setTurns(next)
    setText('')
    setBusy(true)
    const r = await askHelper(next, lang, t('hp.error'))
    setTurns((cur) => [...cur, { role: 'assistant', content: (r.reply ?? r.message ?? t('hp.error')).replace(/^\s*[*•]\s+/gm, '- ').replace(/\*+/g, '') }])
    setBusy(false)
  }

  const suggestions = [t('hp.s1'), t('hp.s2'), t('hp.s3')]

  return (
    <div dir={dir} className="fixed bottom-4 z-40 end-4">
      {open && (
        <section
          role="dialog"
          aria-label={t('hp.title')}
          className="luxe-card mb-3 flex h-[min(30rem,70vh)] w-[min(92vw,22rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl"
        >
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-base font-bold text-gold">{t('hp.title')}</h2>
            {turns.length > 0 && !busy && (
              <button type="button" onClick={() => setTurns([])} className="ms-auto me-2 rounded-lg px-2 py-1 text-xs text-muted hover:text-ink">
                {t('hp.reset')}
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} aria-label={t('hp.close')} className="rounded-lg p-1 text-muted hover:text-ink">
              <Icon name="x" className="h-5 w-5" />
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm" aria-live="polite">
            <p className="rounded-xl bg-surface-2 px-3 py-2 text-ink">{t('hp.hello')}</p>
            {turns.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-line px-3 py-1 text-xs text-muted transition hover:border-gold hover:text-gold">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {turns.map((m, i) => (
              <p
                key={i}
                className={`whitespace-pre-wrap rounded-xl px-3 py-2 ${m.role === 'user' ? 'bg-gold-soft text-ink' : 'bg-surface-2 text-ink'}`}
              >
                {m.content}
              </p>
            ))}
            {busy && <p className="px-1 text-xs text-muted">{t('hp.thinking')}</p>}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void send(text)
            }}
            className="border-t border-line p-3"
          >
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={600}
                placeholder={t('hp.placeholder')}
                aria-label={t('hp.placeholder')}
                className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-gold"
              />
              <button type="submit" disabled={busy || !text.trim()} className="rounded-xl bg-gold px-3 py-2 text-sm font-bold text-black disabled:opacity-50">
                {t('hp.send')}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted">{t('hp.note')}</p>
          </form>
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full bg-gold px-4 py-3 text-sm font-bold text-black shadow-lg transition hover:brightness-110"
      >
        <Icon name="chat" className="h-5 w-5" />
        {t('hp.open')}
      </button>
    </div>
  )
}
