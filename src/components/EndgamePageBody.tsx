'use client'

import Link from 'next/link'
import EndgamePlayer from './EndgamePlayer'
import { Badge } from './ui'
import { ENDGAMES } from '../data/endgames'
import { useI18n } from '../lib/i18n'
import { useEndgameLoc } from '../lib/i18n/content'

export default function EndgamePageBody({ endgameId, nextId }: { endgameId: string; nextId: string }) {
  const en = useI18n().locale === 'en'
  const lt = useEndgameLoc()
  const e = lt(ENDGAMES.find((x) => x.id === endgameId)!)
  const next = lt(ENDGAMES.find((x) => x.id === nextId)!)
  const level = en ? (e.level === 'سهل' ? 'Easy' : e.level === 'متوسط' ? 'Medium' : 'Advanced') : e.level
  return (
    <>
      <nav aria-label={en ? 'Breadcrumb' : 'مسار الصفحة'} className="mb-3 text-sm text-muted">
        <Link href="/endgames" className="hover:text-gold">{en ? 'Endgame Lab' : 'معمل النهايات'}</Link>
        <span className="mx-2">/</span>
        <span>{e.theme}</span>
      </nav>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{e.name}</h1>
      <p className="text-sm text-muted" dir="ltr">{e.en}</p>
      <div className="mt-2 mb-3 flex flex-wrap gap-2">
        <Badge tone={e.level === 'سهل' ? 'emerald' : e.level === 'متوسط' ? 'gold' : 'danger'}>{level}</Badge>
        <Badge tone="muted">{e.theme}</Badge>
      </div>
      <p className="mb-5 max-w-3xl text-lg">{e.text}</p>

      <EndgamePlayer endgameId={e.id} nextId={next.id} />

      <nav aria-label={en ? 'More positions' : 'مواقف تانية'} className="mt-10 border-t border-line pt-5 text-sm">
        <Link href={`/endgames/${next.id}`} className="text-muted hover:text-gold">{en ? `Next position: ${next.name} →` : `الموقف الجاي: ${next.name} ←`}</Link>
      </nav>
    </>
  )
}
