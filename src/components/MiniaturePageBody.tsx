'use client'

import Link from 'next/link'
import TrapViewer from './TrapViewer'
import RichText from './RichText'
import { Badge } from './ui'
import { MINIATURES } from '../data/miniatures'
import { useI18n } from '../lib/i18n'
import { useTrapLoc } from '../lib/i18n/content'

function pgn(moves: string[]) {
  return moves.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${m}` : m)).join(' ')
}

export default function MiniaturePageBody({ miniatureId, nextId }: { miniatureId: string; nextId: string }) {
  const en = useI18n().locale === 'en'
  const lt = useTrapLoc()
  const t = lt(MINIATURES.find((x) => x.id === miniatureId)!)
  const next = lt(MINIATURES.find((x) => x.id === nextId)!)
  const winner = t.side === 'w' ? t.white : t.black
  const level = en ? (t.level === 'سهل' ? 'Easy' : t.level === 'متوسط' ? 'Medium' : 'Advanced') : t.level
  const n = Math.ceil(t.moves.length / 2)
  return (
    <>
      <nav aria-label={en ? 'Breadcrumb' : 'مسار الصفحة'} className="mb-3 text-sm text-muted">
        <Link href="/miniatures" className="hover:text-gold">{en ? 'Miniatures' : 'ماتشات خاطفة'}</Link>
        <span className="mx-2">/</span>
        <span>{t.opening}</span>
      </nav>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{t.name}</h1>
      <p className="text-sm text-muted" dir="ltr">{t.en}</p>
      <div className="mt-2 mb-3 flex flex-wrap gap-2">
        <Badge tone="muted">{t.opening}</Badge>
        <Badge tone="muted">{level}</Badge>
        <Badge tone={t.side === 'w' ? 'gold' : 'emerald'}>{en ? `Won by ${t.side === 'w' ? 'White' : 'Black'}` : `كسب ${t.side === 'w' ? 'الأبيض' : 'الأسود'}`}</Badge>
        <Badge tone="danger">{en ? `Mate in ${n}` : `مات في ${n}`}</Badge>
      </div>
      <p className="mb-1 text-sm text-muted" dir="ltr">
        {t.white} ({t.whiteElo}) vs {t.black} ({t.blackElo}) — {t.date}
      </p>
      <p className="mb-5 text-sm">
        <a href={t.source} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline" dir="ltr">
          {en ? 'Original game on Lichess ↗' : 'الماتش الأصلي على Lichess ↗'}
        </a>
      </p>
      <p className="mb-5 max-w-3xl text-lg">{t.summary}</p>

      <TrapViewer trapId={t.id} items={MINIATURES} bucket="miniatures" />

      <section aria-labelledby="avoid" className="mt-8 rounded-2xl border border-gold/30 bg-gold-soft p-5">
        <h2 id="avoid" className="mb-2 font-display text-lg font-bold text-gold">{en ? 'The lesson' : 'الدرس المستفاد'}</h2>
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
                <RichText text={t.notes[i]} className="text-sm" />
              </li>
            ) : null,
          )}
        </ol>
      </section>

      <p className="mt-6 text-xs text-muted">
        {en
          ? `Game from the Lichess Elite Database (CC0). The mistake and the mate are checked with the Stockfish engine, and every move with chess.js. Winner: ${winner}.`
          : `الماتش من Lichess Elite Database (CC0). الغلطة والمات متحقق منهم بمحرك Stockfish، وكل النقلات بـ chess.js. كسبان: ${winner}.`}
      </p>

      <nav aria-label={en ? 'More games' : 'ماتشات تانية'} className="mt-10 border-t border-line pt-5 text-sm">
        <Link href={`/miniatures/${next.id}`} className="text-muted hover:text-gold">{en ? `Next game: ${next.name} →` : `الماتش الجاي: ${next.name} ←`}</Link>
      </nav>
    </>
  )
}
