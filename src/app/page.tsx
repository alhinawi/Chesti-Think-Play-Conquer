 'use client'

import Link from 'next/link'
import ChessBoard from '../components/ChessBoard'
import { Badge, Icon, LinkButton } from '../components/ui'
import ContinueCard from '../components/ContinueCard'
import { CHAPTERS, ALL_LESSONS } from '../data/lessons'
import { TRAPS } from '../data/traps'
import { OPENINGS } from '../data/openings'
import { GAMES } from '../data/games'
import { ENDGAMES } from '../data/endgames'
import { PUZZLES } from '../data/puzzles'
import { ARTICLES } from '../data/encyclopedia'
import { WORLD3D_POSITIONS } from '../data/world3d'
import { SITE } from '../lib/site'
import { BOTS } from '../data/bots'
import { BotAvatar } from '../components/BotAvatar'
import { COACH } from '../lib/coach'
import { RANKS } from '../lib/rank'
import { useI18n } from '../lib/i18n'
import { useBotLoc } from '../lib/i18n/content'
import { useRankLoc } from '../lib/i18n/content'

const SECTIONS = [
  { href: '/learn', group: 'learn', icon: 'learn', key: 'learn', n: ALL_LESSONS.length },
  { href: '/puzzles', group: 'train', icon: 'bulb', key: 'puzzles', n: PUZZLES.length },
  { href: '/openings', group: 'learn', icon: 'compass', key: 'openings', n: OPENINGS.length },
  { href: '/games', group: 'learn', icon: 'flag', key: 'games', n: GAMES.length },
  { href: '/traps', group: 'learn', icon: 'trap', key: 'traps', n: TRAPS.length },
  { href: '/encyclopedia', group: 'learn', icon: 'book', key: 'encyclopedia', n: ARTICLES.length },
  { href: '/play/computer', group: 'play', icon: 'cpu', key: 'computer', n: 8 },
  { href: '/world3d', group: 'play', icon: 'globe', key: 'world3d', n: WORLD3D_POSITIONS.length },
  { href: '/endgames', group: 'train', icon: 'check', key: 'endgames', n: ENDGAMES.length },
  { href: '/rush', group: 'train', icon: 'clock', key: 'rush', n: 0 },
  { href: '/squares', group: 'train', icon: 'search', key: 'squares', n: 0 },
  { href: '/daily', group: 'train', icon: 'star', key: 'daily', n: 0 },
  { href: '/play/friend', group: 'play', icon: 'users', key: 'friend', n: 0 },
]


export default function Home() {
  const { t } = useI18n()
  const bl = useBotLoc()
  const { rank: rk } = useRankLoc()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    inLanguage: 'ar',
    description: SITE.description,
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="grid items-center gap-8 py-4 lg:grid-cols-[1.1fr_1fr] lg:py-10">
        <div className="animate-fade-up">
          <Badge>{t('home.badge')}</Badge>
          <h1 className="mt-4 font-display text-4xl leading-[1.25] font-bold sm:text-5xl">
            {t('home.titleA')} <span className="text-gold-grad">{t('home.titleHighlight')}</span>
            <br />
            {t('home.titleB')}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            {t('home.sub')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton to="/learn">
              <Icon name="learn" /> {t('home.startLesson')}
            </LinkButton>
            <LinkButton to="/play/computer" variant="outline">
              <Icon name="cpu" /> {t('home.playNow')}
            </LinkButton>
          </div>
          <ContinueCard />
        </div>
        <div className="mx-auto w-full max-w-[460px]">
          <ChessBoard
            fen="r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4"
            movable={false}
            arrows={[{ from: 'c4', to: 'f7', color: 'gold' }]}
            highlights={['f7']}
          />
          <div className="animate-bubble mt-3 flex items-start gap-2 text-sm" style={{ animationDelay: '0.5s' }}>
            <span className="animate-float grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald/20 text-xl" aria-hidden>☕</span>
            <p className="rounded-2xl rounded-ss-sm border border-emerald/30 bg-surface/90 px-3 py-2">
              <strong className="me-1 text-emerald">{COACH.name}:</strong>
              {t('home.coachLine')}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="sections" className="mt-10">
        <h2 id="sections" className="mb-4 font-display text-2xl font-bold">{t('home.sectionsTitle')}</h2>
        {(
          [
            ['learn', t('home.groups.learn')],
            ['train', t('home.groups.train')],
            ['play', t('home.groups.play')],
          ] as const
        ).map(([g, label]) => (
          <div key={g} className="mb-6">
            <h3 className="mb-3 text-sm font-bold tracking-wide text-gold">{label}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SECTIONS.filter((s) => s.group === g).map((s) => (
                <Link key={s.href} href={s.href} className="luxe-card group rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-gold/50">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-soft text-gold">
                    <Icon name={s.icon} />
                  </span>
                  <h4 className="mt-3 text-lg font-bold group-hover:text-gold">{t(`home.cards.${s.key}.title`)}</h4>
                  <p className="mt-1 text-sm text-muted">{t(`home.cards.${s.key}.desc`, { n: s.n })}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section aria-labelledby="bots" className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="bots" className="font-display text-2xl font-bold">{t('home.botsTitle')}</h2>
          <Link href="/play/computer" className="text-sm font-bold text-gold hover:underline">{t('home.botsLink')}</Link>
        </div>
        <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
          {BOTS.map((b) => (
            <li key={b.id} className="w-56 shrink-0 snap-start sm:w-auto">
              <Link href="/play/computer" className="luxe-card group flex h-full flex-col rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-gold/50">
                <span className="flex items-center gap-2">
                  <span className="transition group-hover:scale-105"><BotAvatar bot={b} className="h-11 w-11 text-sm" /></span>
                  <span>
                    <span className="block font-bold group-hover:text-gold">{b.name}</span>
                    <span className="text-xs text-muted">{t('home.level')} <bdi className="ltr">{b.level}</bdi></span>
                  </span>
                </span>
                <span className="mt-2 text-sm text-muted">«{bl(b).greet}»</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ranks" className="relative mt-12 overflow-hidden rounded-3xl border border-gold/25 bg-surface p-5 sm:p-7">
        <h2 id="ranks" className="font-display text-2xl font-bold">{t('lx.hmRanks', { a: rk(RANKS[0].name), b: rk(RANKS[RANKS.length - 1].name) })}</h2>
        <p className="mt-1 text-muted">{t('lx.hmRanksDesc')}</p>
        <ol className="mt-4 flex flex-wrap gap-2">
          {RANKS.map((r) => (
            <li key={r.name} className="flex items-center gap-1.5 rounded-full border border-line bg-bg/60 px-3 py-1.5 text-sm">
              <span className="text-lg leading-none text-gold" aria-hidden>{r.icon}</span> {rk(r.name)}
            </li>
          ))}
        </ol>
        <LinkButton to="/me" variant="outline" className="mt-5">
          <Icon name="star" /> {t('lx.hmSeeRank')}
        </LinkButton>
      </section>

      <section aria-labelledby="path" className="mt-12">
        <h2 id="path" className="mb-4 font-display text-2xl font-bold">{t('lx.hmPath')}</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHAPTERS.map((c, i) => (
            <li key={c.id}>
              <Link href={`/learn/${c.lessons[0].id}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 hover:border-gold/50">
                <span className="text-3xl text-gold" aria-hidden>{c.glyph}</span>
                <span>
                  <span className="block text-xs text-muted">{t('lx.hmChapter', { n: i + 1 })}</span>
                  <span className="font-bold">{c.title}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
