'use client'

import Link from 'next/link'
import OpeningViewer from './OpeningViewer'
import { Badge, LinkButton } from './ui'
import { OPENINGS } from '../data/openings'
import { useI18n } from '../lib/i18n'
import { TRAPS } from '../data/traps'
import { useOpeningLoc, useTrapLoc } from '../lib/i18n/content'

type Related = { id: string; name: string; summary: string }

function pgn(moves: string[]) {
  return moves.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${m}` : m)).join(' ')
}

export default function OpeningPageBody({ openingId, nextId, related }: { openingId: string; nextId: string; related: Related[] }) {
  const { locale } = useI18n()
  const en = locale === 'en'
  const lo = useOpeningLoc()
  const lt = useTrapLoc()
  const o = lo(OPENINGS.find((x) => x.id === openingId)!)
  const next = lo(OPENINGS.find((x) => x.id === nextId)!)
  const sideLabel = o.side === 'w' ? (en ? 'For White' : 'للأبيض') : o.side === 'b' ? (en ? 'For Black' : 'للأسود') : en ? 'For both sides' : 'للجانبين'
  const level = o.level === 'سهل' ? (en ? 'Easy' : o.level) : o.level === 'متوسط' ? (en ? 'Medium' : o.level) : en ? 'Advanced' : o.level
  return (
    <>
      <nav aria-label={en ? 'Breadcrumb' : 'مسار الصفحة'} className="mb-3 text-sm text-muted">
        <Link href="/openings" className="hover:text-gold">{en ? 'Openings' : 'الافتتاحيات'}</Link>
        <span className="mx-2">/</span>
        <span>{sideLabel}</span>
      </nav>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{o.name}</h1>
      <p className="text-sm text-muted" dir="ltr">{o.en} • {o.eco}</p>
      <div className="mt-2 mb-3 flex flex-wrap gap-2">
        <Badge tone={o.level === 'سهل' ? 'emerald' : o.level === 'متوسط' ? 'gold' : 'danger'}>{level}</Badge>
        <Badge tone={o.side === 'w' ? 'gold' : 'emerald'}>{sideLabel}</Badge>
      </div>
      <p className="mb-5 max-w-3xl text-lg">{o.summary}</p>

      <div className="mb-5">
        <LinkButton to={`/play/computer?opening=${o.id}`} variant="outline">{en ? `Try the ${o.name} against the computer ←` : `جرّب ${o.name} ضد الكمبيوتر ←`}</LinkButton>
      </div>

      <OpeningViewer openingId={o.id} />

      <section aria-labelledby="story" className="mt-8 rounded-2xl border border-gold/30 bg-gold-soft p-5">
        <h2 id="story" className="mb-2 font-display text-lg font-bold text-gold">{en ? "Coach's tip" : 'نصيحة المدرب'}</h2>
        <p className="text-sm">
          {en
            ? `Don't memorize the line by rote: play the ${o.name} a few times and see how opponents respond. If they follow the line here, go back and review the move where they deviated. If they leave the line, remember the opening principles: development, center, king safety.`
            : `متتحفظش الخط بالبلدي: العب ${o.name} كذا دور وشوف الخصوم بيردوا إزاي. لو ردهم في الخط هنا، ارجع راجع النقلة اللي زاغوا عنها. لو ردهم بره الخط، خليك فاكر مبادئ الافتتاحية: تطوير، مركز، أمان الملك.`}
        </p>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <h2 id="related" className="mb-2 font-display text-lg font-bold">{en ? 'Traps from the same family' : 'فخاخ من نفس العيلة'}</h2>
          <ul className="space-y-1 text-sm">
            {related.map((r) => {
              const tr = TRAPS.find((x) => x.id === r.id)
              const t = tr ? lt(tr) : r
              return (
              <li key={t.id}>
                <Link href={`/traps/${t.id}`} className="text-gold hover:underline">{t.name}</Link>
                <span className="text-muted"> - {t.summary.slice(0, 60)}…</span>
              </li>
              )
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="moves" className="mt-6">
        <h2 id="moves" className="mb-2 font-display text-lg font-bold">{en ? 'The full main line' : 'الخط الرئيسي كامل'}</h2>
        <p dir="ltr" className="rounded-xl border border-line bg-surface p-3 text-start font-mono text-sm">{pgn(o.moves)}</p>
        <ol className="mt-4 space-y-2">
          {o.moves.map((m, i) =>
            o.notes[i] ? (
              <li key={i} className="flex gap-3 rounded-lg p-2">
                <span dir="ltr" className="w-20 shrink-0 font-mono text-sm font-bold text-gold">
                  {Math.floor(i / 2) + 1}.{i % 2 ? '..' : ''} {m}
                </span>
                <span className="text-sm">{o.notes[i]}</span>
              </li>
            ) : null,
          )}
        </ol>
      </section>

      <nav aria-label={en ? 'More openings' : 'افتتاحيات تانية'} className="mt-10 border-t border-line pt-5 text-sm">
        <Link href={`/openings/${next.id}`} className="text-muted hover:text-gold">{en ? `Next opening: ${next.name} ←` : `الافتتاحية الجاية: ${next.name} ←`}</Link>
      </nav>
    </>
  )
}
