'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge, Icon } from './ui'
import { BOTS } from '../data/bots'
import { BotAvatar } from './BotAvatar'
import { ALL_LESSONS, CHAPTERS } from '../data/lessons'
import { PUZZLES } from '../data/puzzles'
import { TRAPS } from '../data/traps'
import { OPENINGS } from '../data/openings'
import { ENDGAMES } from '../data/endgames'
import { useAuth } from '../lib/auth'
import { today, useProgress } from '../lib/progress'
import { ACHIEVEMENTS, bestStreakOf, rankOf, RANKS, streakOf, totalWins, XP, xpOf } from '../lib/rank'

export default function Profile() {
  const p = useProgress()
  const { status } = useAuth()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted || status === 'loading') return <div className="h-96 animate-pulse rounded-2xl bg-surface" />
  if (status !== 'authed') return <GuestProfile />

  const xp = xpOf(p)
  const r = rankOf(xp)
  const streak = streakOf(p.days, today())
  const best = bestStreakOf(p.days)
  const totals = { lessons: ALL_LESSONS.length, traps: TRAPS.length, puzzles: PUZZLES.length, openings: OPENINGS.length, endgames: ENDGAMES.length }
  const unlocked = ACHIEVEMENTS.filter((a) => a.test(p, totals))
  const nextLesson = ALL_LESSONS.find((l) => !p.lessons.includes(l.id))

  return (
    <div className="flex flex-col gap-6">
      <section className="luxe-card relative overflow-hidden rounded-3xl border border-gold/30 p-5 sm:p-7">
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-b from-gold-2 to-gold text-5xl leading-none text-[#1a1408] shadow-[0_10px_30px_-10px_var(--gold)]" aria-hidden>
            {r.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">رتبتك</p>
            <h2 className="font-display text-2xl font-bold text-gold sm:text-3xl">{r.name}</h2>
            <p className="mt-1 text-sm">
              <bdi className="ltr font-bold">{xp}</bdi> نقطة{r.next ? <> — فاضلك <bdi className="ltr font-bold">{r.next.xp - xp}</bdi> لـ«{r.next.name}»</> : ' — وصلت للقمة!'}
            </p>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/30" role="progressbar" aria-valuenow={r.pct} aria-valuemin={0} aria-valuemax={100} aria-label="التقدم للرتبة الجاية">
              <div className="h-full rounded-full bg-gradient-to-l from-gold-2 to-gold transition-all duration-700" style={{ width: `${r.pct}%` }} />
            </div>
          </div>
        </div>
        <dl className="relative mt-5 grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
          {(
            [
              ['🔥 أيام ورا بعض', streak, `أحسن سلسلة: ${best}`],
              ['الدروس', `${p.lessons.length}/${totals.lessons}`, ''],
              ['الألغاز', `${p.puzzles.length}/${totals.puzzles}`, ''],
              ['الافتتاحيات', `${(p.openings || []).length}/${totals.openings}`, ''],
              ['النهايات', `${(p.endgames || []).length}/${totals.endgames}`, ''],
              ['انتصارات', totalWins(p), `من ${p.games || 0} دور`],
            ] as const
          ).map(([k, v, sub]) => (
            <div key={k} className="rounded-xl border border-line bg-bg/60 p-3">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="ltr text-xl font-bold">{v}</dd>
              {sub && <dd className="text-[0.7rem] text-muted">{sub}</dd>}
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="map-h">
        <div className="mb-3 flex items-end justify-between gap-2">
          <h2 id="map-h" className="font-display text-xl font-bold">خريطة الكورس</h2>
          {nextLesson && (
            <Link href={`/learn/${nextLesson.id}`} className="text-sm font-bold text-gold hover:underline">
              كمّل: {nextLesson.title} ←
            </Link>
          )}
        </div>
        <ol className="relative flex flex-col gap-3 border-s-2 border-dashed border-gold/30 ps-5">
          {CHAPTERS.map((c) => {
            const done = c.lessons.filter((l) => p.lessons.includes(l.id)).length
            const full = done === c.lessons.length
            return (
              <li key={c.id} className="relative">
                <span className={`absolute -start-[1.95rem] top-3 grid h-6 w-6 place-items-center rounded-full border-2 text-xs ${full ? 'border-gold bg-gold text-[#1a1408]' : done ? 'border-gold bg-bg text-gold' : 'border-line bg-bg text-muted'}`} aria-hidden>
                  {full ? '✓' : ''}
                </span>
                <div className="luxe-card rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl leading-none text-gold" aria-hidden>{c.glyph}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">{c.title}</h3>
                      <p className="text-xs text-muted">
                        <bdi className="ltr">{done}/{c.lessons.length}</bdi> دروس
                      </p>
                    </div>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {c.lessons.map((l) => {
                      const ok = p.lessons.includes(l.id)
                      return (
                        <li key={l.id}>
                          <Link href={`/learn/${l.id}`} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${ok ? 'border-gold/50 bg-gold-soft text-gold' : 'border-line text-muted hover:border-gold/50 hover:text-ink'}`}>
                            {ok && <span aria-label="خلصان">✓</span>}
                            {l.title}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <section aria-labelledby="ach-h">
        <h2 id="ach-h" className="mb-3 font-display text-xl font-bold">
          الأوسمة <span className="text-base text-muted"><bdi className="ltr">{unlocked.length}/{ACHIEVEMENTS.length}</bdi></span>
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const on = unlocked.includes(a)
            return (
              <li key={a.id} className={`rounded-2xl border p-3 text-center transition ${on ? 'border-gold/50 bg-gold-soft' : 'border-line bg-surface opacity-55 grayscale'}`}>
                <span className="block text-3xl" aria-hidden>{a.icon}</span>
                <span className="mt-1 block text-sm font-bold">{a.name}</span>
                <span className="block text-xs text-muted">{a.desc}</span>
                {!on && <span className="sr-only">لسه ماخدتهوش</span>}
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="bots-h">
        <h2 id="bots-h" className="mb-3 font-display text-xl font-bold">ضحاياك من الأبطال</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BOTS.map((b) => {
            const w = p.wins?.[b.id] || 0
            return (
              <li key={b.id} className={`flex items-center gap-2 rounded-xl border p-2 ${w ? 'border-emerald/40 bg-emerald/5' : 'border-line bg-surface'}`}>
                <BotAvatar bot={b} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold"><bdi className="ltr">{b.name}</bdi></span>
                  <span className="text-xs text-muted">{w ? `كسبته ${w} مرة` : 'لسه'}</span>
                </span>
              </li>
            )
          })}
        </ul>
        <Link href="/play/computer" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-gold hover:underline">
          <Icon name="cpu" className="h-4 w-4" /> العب ضد الكمبيوتر
        </Link>
      </section>

      <section aria-labelledby="ranks-h" className="luxe-card rounded-2xl p-4">
        <h2 id="ranks-h" className="mb-2 font-bold">الرتب والنقط</h2>
        <ol className="flex flex-wrap gap-1.5">
          {RANKS.map((x, i) => (
            <li key={x.name}>
              <Badge tone={i <= r.index ? 'gold' : 'muted'}>
                <span className="inline-flex items-center gap-1.5">{x.icon} {x.name} <bdi className="ltr opacity-70">{x.xp}</bdi></span>
              </Badge>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted">
          الدرس {XP.lesson} نقطة، واللغز {XP.puzzle}، والفخ {XP.trap}، ولغز اليوم {XP.daily} زيادة، وكل دور ضد الكمبيوتر {XP.game}، والفوز {XP.win} زيادة. كله بيتسجل في حسابك.
        </p>
      </section>
    </div>
  )
}

/** Guests see general info only - no personal data without an account. */
function GuestProfile() {
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="ranks-h" className="luxe-card rounded-2xl p-4">
        <h2 id="ranks-h" className="mb-2 font-bold">الرتب والنقط</h2>
        <ol className="flex flex-wrap gap-1.5">
          {RANKS.map((x) => (
            <li key={x.name}>
              <Badge tone={'muted'}>
                <span className="inline-flex items-center gap-1.5">{x.icon} {x.name} <bdi className="ltr opacity-70">{x.xp}</bdi></span>
              </Badge>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted">
          الدرس {XP.lesson} نقطة، واللغز {XP.puzzle}، والفخ {XP.trap}، ولغز اليوم {XP.daily} زيادة، وكل دور ضد الكمبيوتر {XP.game}، والفوز {XP.win} زيادة. كله بيتسجل في حسابك.
        </p>
      </section>
    </div>
  )
}
