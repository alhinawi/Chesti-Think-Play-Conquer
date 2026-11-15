'use client'

import Link from 'next/link'
import { CHAPTERS } from '../data/lessons'
import { useAuth } from '../lib/auth'
import { useProgress } from '../lib/progress'
import { Icon } from './ui'

export default function LessonList() {
  const { lessons: doneAll } = useProgress()
  const { status } = useAuth()
  const done = status === 'authed' ? doneAll : []
  return (
    <div className="space-y-8">
      {CHAPTERS.map((c, ci) => {
        const count = c.lessons.filter((l) => done.includes(l.id)).length
        return (
          <section key={c.id} aria-labelledby={`ch-${c.id}`}>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl text-gold" aria-hidden>{c.glyph}</span>
                <div>
                  <p className="text-xs text-muted">الفصل {ci + 1}</p>
                  <h2 id={`ch-${c.id}`} className="font-display text-xl font-bold">{c.title}</h2>
                  <p className="text-sm text-muted">{c.desc}</p>
                </div>
              </div>
              <span className="shrink-0 text-sm text-muted">{status === 'authed' ? `${count}/${c.lessons.length}` : `${c.lessons.length} ${c.lessons.length === 2 ? 'درسين' : c.lessons.length <= 10 ? 'دروس' : 'درس'}`}</span>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {c.lessons.map((l, li) => {
                const isDone = done.includes(l.id)
                return (
                  <li key={l.id}>
                    <Link
                      href={`/learn/${l.id}`}
                      className={`flex h-full items-start gap-3 rounded-xl border p-4 transition hover:border-gold/60 ${isDone ? 'border-emerald/40 bg-emerald/5' : 'border-line bg-surface'}`}
                    >
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${isDone ? 'bg-emerald text-white' : 'bg-surface-2 text-muted'}`}>
                        {isDone ? <Icon name="check" className="h-4 w-4" /> : li + 1}
                      </span>
                      <span>
                        <span className="block font-bold">{l.title}</span>
                        <span className="block text-sm text-muted">{l.summary}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
