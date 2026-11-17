'use client'

import Link from 'next/link'
import TrapViewer from './TrapViewer'
import RichText from './RichText'
import { Badge } from './ui'
import { TRAPS } from '../data/traps'
import { useI18n } from '../lib/i18n'
import { useTrapLoc } from '../lib/i18n/content'

function pgn(moves: string[]) {
  return moves.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${m}` : m)).join(' ')
}

export default function TrapPageBody({ trapId, nextId }: { trapId: string; nextId: string }) {
  const en = useI18n().locale === 'en'
  const lt = useTrapLoc()
  const t = lt(TRAPS.find((x) => x.id === trapId)!)
  const next = lt(TRAPS.find((x) => x.id === nextId)!)
  const level = en ? (t.level === 'سهل' ? 'Easy' : t.level === 'متوسط' ? 'Medium' : 'Advanced') : t.level
  return (
    <>
      <nav aria-label={en ? 'Breadcrumb' : 'مسار الصفحة'} className="mb-3 text-sm text-muted">
        <Link href="/traps" className="hover:text-gold">{en ? 'Traps' : 'الفخاخ'}</Link>
        <span className="mx-2">/</span>
        <span>{t.opening}</span>
      </nav>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{t.name}</h1>
      <p className="text-sm text-muted" dir="ltr">{t.en}</p>
      <div className="mt-2 mb-3 flex flex-wrap gap-2">
        <Badge tone="muted">{t.opening}</Badge>
        <Badge tone="muted">{level}</Badge>
        <Badge tone={t.side === 'w' ? 'gold' : 'emerald'}>{en ? `Set by ${t.side === 'w' ? 'White' : 'Black'}` : `بينصبه ${t.side === 'w' ? 'الأبيض' : 'الأسود'}`}</Badge>
      </div>
      <p className="mb-5 max-w-3xl text-lg">{t.summary}</p>

      <TrapViewer trapId={t.id} />

      <section aria-labelledby="avoid" className="mt-8 rounded-2xl border border-gold/30 bg-gold-soft p-5">
        <h2 id="avoid" className="mb-2 font-display text-lg font-bold text-gold">{en ? "How not to fall for it" : 'إزاي ماتقعش فيه'}</h2>
        <RichText text={t.avoid} />
      </section>

      <section aria-labelledby="moves" className="mt-6">
        <h2 id="moves" className="mb-2 font-display text-lg font-bold">{en ? 'All the moves' : 'النقلات كلها'}</h2>
        <p dir="ltr" className="rounded-xl border border-line bg-surface p-3 text-start font-mono text-sm">{pgn(t.moves)}</p>
        <ol className="mt-4 space-y-2">
          {t.moves.map((m, i) =>
            t.notes[i] ? (
              <li key={i} className={`flex gap-3 rounded-lg p-2 ${i === t.mistake ? 'bg-danger/10' : ''}`}>
                <span dir="ltr" className="w-20 shrink-0 font-mono text-sm font-bold text-gold">
                  {Math.floor(i / 2) + 1}.{i % 2 ? '..' : ''} {m}
                </span>
                <span className="text-sm">{t.notes[i]}</span>
              </li>
            ) : null,
          )}
        </ol>
      </section>

      <nav aria-label={en ? 'More traps' : 'فخاخ تانية'} className="mt-10 border-t border-line pt-5 text-sm">
        <Link href={`/traps/${next.id}`} className="text-muted hover:text-gold">{en ? `Next trap: ${next.name} ←` : `الفخ الجاي: ${next.name} ←`}</Link>
      </nav>
    </>
  )
}
