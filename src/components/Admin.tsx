'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import * as api from '../lib/api'
import { useAuth } from '../lib/auth'
import { Badge, Card, Icon } from './ui'
import AdminAntiCheat from './AdminAntiCheat'

const KIND_LABELS: Record<string, string> = {
  rush: 'سباق الألغاز',
  puzzles: 'الألغاز',
  daily: 'اللغز اليومي',
  games: 'الأدوار',
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="luxe-card rounded-2xl p-4 text-center">
      <p className="font-display text-2xl font-bold text-gold">
        <bdi className="ltr">{value}</bdi>
      </p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  )
}

export default function Admin() {
  const { status, user } = useAuth()
  const [data, setData] = useState<api.AdminOverview | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'failed' | 'denied'>('idle')

  const load = useCallback(() => {
    setState('loading')
    api
      .adminOverview()
      .then((d) => {
        setData(d)
        setState('ok')
      })
      .catch((e) => setState(e instanceof Error && e.message === 'admin_only' ? 'denied' : 'failed'))
  }, [])

  useEffect(() => {
    if (status === 'authed' && user?.admin && state === 'idle') load()
  }, [status, user, state, load])

  if (status === 'loading') return <div className="h-60 animate-pulse rounded-2xl bg-surface" />

  if (status !== 'authed' || !user) {
    return (
      <Card className="border border-gold/30 p-6 text-center">
        <p className="font-display text-lg font-bold">لوحة التحكم دي للأدمن بس</p>
        <p className="mt-2 text-sm text-muted">سجّل دخول بحساب الأدمن من صفحة ملفك وبعدين ارجع هنا.</p>
        <Link href="/me" className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-2 to-gold px-5 py-2.5 text-sm font-bold text-[#1a1408] transition hover:brightness-110">
          روح لصفحة ملفي
        </Link>
      </Card>
    )
  }

  if (!user.admin || state === 'denied') {
    return (
      <Card className="border border-danger/30 p-6 text-center">
        <p className="font-display text-lg font-bold">الحساب ده مش أدمن</p>
        <p className="mt-2 text-sm text-muted">
          <bdi className="ltr">{user.email}</bdi> ماعندوش صلاحية لوحة التحكم.
        </p>
      </Card>
    )
  }

  const total = data ? data.gamesByResult.win + data.gamesByResult.loss + data.gamesByResult.draw : 0
  const pct = (n: number) => (total ? (n / total) * 100 : 0)
  const fmtDate = (iso: string) => new Intl.DateTimeFormat('ar-EG-u-nu-latn', { timeZone: 'Africa/Cairo', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          آخر تحديث: {data ? fmtDate(data.health.generatedAt) : '…'}
        </p>
        <button
          type="button"
          onClick={load}
          disabled={state === 'loading'}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold text-muted transition hover:text-ink disabled:opacity-40"
        >
          <Icon name="reset" className="h-4 w-4" />
          حدّث
        </button>
      </div>

      {state === 'loading' && <div className="h-60 animate-pulse rounded-2xl bg-surface" />}
      {state === 'failed' && (
        <Card className="border border-danger/30 p-6 text-center">
          <p className="text-sm text-muted">مش قادرين نوصل لبيانات اللوحة دلوقتي — ممكن الـ API لسه ماتحدّثش. جرّب «حدّث» بعد شوية.</p>
        </Card>
      )}

      {state === 'ok' && data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="اللاعبين" value={data.counts.users} />
            <Stat label="جداد آخر 7 أيام" value={data.counts.newUsers} />
            <Stat label="جلسات نشطة" value={data.counts.sessions} />
            <Stat label="أدوار مسجلة" value={data.counts.games} />
            <Stat label="أدوار الأسبوع" value={data.counts.gamesWeek} />
            <Stat label="نتايج محفوظة" value={data.counts.scores} />
          </div>

          <section aria-labelledby="adm-res">
            <h2 className="mb-3 font-display text-xl font-bold">نتايج الأدوار</h2>
            <Card className="p-4">
              {total === 0 ? (
                <p className="py-4 text-center text-sm text-muted">لسه مفيش أدوار متسجلة.</p>
              ) : (
                <>
                  <div className="flex h-4 overflow-hidden rounded-full" role="img" aria-label={`فوز ${data.gamesByResult.win}، خسارة ${data.gamesByResult.loss}، تعادل ${data.gamesByResult.draw}`}>
                    <span className="bg-emerald" style={{ width: `${pct(data.gamesByResult.win)}%` }} />
                    <span className="bg-danger" style={{ width: `${pct(data.gamesByResult.loss)}%` }} />
                    <span className="bg-muted" style={{ width: `${pct(data.gamesByResult.draw)}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
                    <span>فوز: <bdi className="ltr font-bold text-emerald">{data.gamesByResult.win}</bdi></span>
                    <span>خسارة: <bdi className="ltr font-bold text-danger">{data.gamesByResult.loss}</bdi></span>
                    <span>تعادل: <bdi className="ltr font-bold">{data.gamesByResult.draw}</bdi></span>
                  </div>
                </>
              )}
            </Card>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="adm-best">
              <h2 className="mb-3 font-display text-xl font-bold">أفضل النتايج</h2>
              <Card className="p-4">
                {data.bestScores.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted">لسه مفيش نتايج.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {data.bestScores.map((b) => (
                      <li key={b.kind} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2 text-sm">
                        <span className="min-w-0 flex-1 truncate font-bold">{KIND_LABELS[b.kind] ?? b.kind}</span>
                        <span className="text-xs text-muted"><bdi className="ltr">{b.players}</bdi> لاعب</span>
                        <span className="font-bold text-gold"><bdi className="ltr">{b.best}</bdi> نقطة</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            <section aria-labelledby="adm-top">
              <h2 className="mb-3 font-display text-xl font-bold">أفضل اللاعبين</h2>
              <Card className="p-4">
                {data.topPlayers.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted">لسه مفيش لاعبين سجّلوا أدوار.</p>
                ) : (
                  <ol className="flex flex-col gap-2">
                    {data.topPlayers.map((p, i) => (
                      <li key={p.name + i} className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm ${i < 3 ? 'border-gold/40 bg-gold-soft' : 'border-line bg-surface'}`}>
                        <span className="w-6 text-center font-bold text-muted"><bdi className="ltr">{i + 1}</bdi></span>
                        <span className="min-w-0 flex-1 truncate font-bold">{p.name}</span>
                        <span className="text-xs text-muted"><bdi className="ltr">{p.wins}</bdi> فوز من <bdi className="ltr">{p.games}</bdi></span>
                        <span className="font-bold text-gold"><bdi className="ltr">{p.points}</bdi> نقطة</span>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            </section>
          </div>

          <section aria-labelledby="adm-new">
            <h2 className="mb-3 font-display text-xl font-bold">أحدث المسجلين</h2>
            <Card className="p-4">
              {data.recentUsers.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">لسه مفيش مسجلين.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.recentUsers.map((u) => (
                    <li key={u.email} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2 text-sm">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-gold-2 to-gold text-xs font-bold text-[#1a1408]" aria-hidden>
                        {u.name.trim().charAt(0) || '؟'}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-bold">{u.name}</span>
                      <span className="hidden truncate text-xs text-muted sm:block"><bdi className="ltr">{u.email}</bdi></span>
                      <span className="shrink-0 text-xs text-muted">{fmtDate(u.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <AdminAntiCheat />

          <section aria-labelledby="adm-health">
            <h2 className="mb-3 font-display text-xl font-bold">صحة النظام</h2>
            <Card className="flex flex-wrap items-center gap-2 p-4">
              <Badge tone="emerald">قاعدة البيانات: شغالة</Badge>
              <Badge tone={data.health.google ? 'emerald' : 'muted'}>تسجيل Google: {data.health.google ? 'متفعّل' : 'مش متظبط'}</Badge>
              <Badge tone="muted">عدد الأدمن: <bdi className="ltr">{data.health.adminCount}</bdi></Badge>
            </Card>
          </section>
        </>
      )}
    </div>
  )
}
