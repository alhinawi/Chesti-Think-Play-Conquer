'use client'

import { useEffect, useState } from 'react'
import * as api from '../lib/api'

type Kind = 'games' | 'rush'

const KINDS: { id: Kind; label: string }[] = [
  { id: 'games', label: 'الأدوار' },
  { id: 'rush', label: 'سباق الألغاز' },
]

const MEDALS = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const [kind, setKind] = useState<Kind>('games')
  const [period, setPeriod] = useState<'all' | 'week'>('all')
  const [entries, setEntries] = useState<api.LeaderboardEntry[]>([])
  const [state, setState] = useState<'loading' | 'ok' | 'failed'>('loading')

  useEffect(() => {
    let on = true
    setState('loading')
    api
      .getLeaderboard(kind, period, 20)
      .then((d) => {
        if (!on) return
        setEntries(d.entries)
        setState('ok')
      })
      .catch(() => on && setState('failed'))
    return () => {
      on = false
    }
  }, [kind, period])

  return (
    <section aria-labelledby="lb-h">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 id="lb-h" className="font-display text-xl font-bold">المتصدرين</h2>
        <div className="flex gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => setKind(k.id)}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition ${kind === k.id ? 'border-gold/50 bg-gold-soft text-gold' : 'border-line text-muted hover:text-ink'}`}
            >
              {k.label}
            </button>
          ))}
          <button
            onClick={() => setPeriod(period === 'all' ? 'week' : 'all')}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition ${period === 'week' ? 'border-emerald/50 bg-emerald/10 text-emerald' : 'border-line text-muted hover:text-ink'}`}
          >
            {period === 'week' ? 'الأسبوع ده' : 'كل الأوقات'}
          </button>
        </div>
      </div>
      <div className="luxe-card rounded-2xl p-4">
        {state === 'loading' && <div className="h-40 animate-pulse rounded-xl bg-surface" />}
        {state === 'failed' && <p className="py-8 text-center text-sm text-muted">مش قادرين نوصل للمتصدرين دلوقتي — جرّب تاني بعد شوية.</p>}
        {state === 'ok' && entries.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">لسه مفيش نتايج هنا. سجّل حسابك والعب — يمكن تكون أول واحد! 🏆</p>
        )}
        {state === 'ok' && entries.length > 0 && (
          <ol className="flex flex-col gap-1.5">
            {entries.map((e) => (
              <li
                key={`${e.rank}-${e.user_id}`}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${e.rank <= 3 ? 'border-gold/40 bg-gold-soft' : 'border-line bg-surface'}`}
              >
                <span className="w-8 text-center font-bold" aria-label={`المركز ${e.rank}`}>
                  {MEDALS[e.rank - 1] || <bdi className="ltr text-muted">{e.rank}</bdi>}
                </span>
                <span className="min-w-0 flex-1 truncate font-bold">{e.name}</span>
                {kind === 'games' && (
                  <span className="text-xs text-muted">
                    <bdi className="ltr">{e.wins ?? 0}</bdi> فوز من <bdi className="ltr">{e.games ?? 0}</bdi>
                  </span>
                )}
                <span className="text-sm font-bold text-gold">
                  <bdi className="ltr">{e.points}</bdi> نقطة
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
