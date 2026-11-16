'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from '../lib/api'
import { Engine } from '../lib/engine'
import { analyzePgnWithEngine } from '../lib/anticheatAnalyze'
import { Badge, Card, Icon } from './ui'

const REASON_LABELS: Record<string, string> = {
  impossibly_fast: 'نقلات أسرع من الطبيعي',
  robotic_timing: 'توقيتات ثابتة بشكل آلي',
  no_think_time: 'كسب من غير وقت تفكير',
  no_timing_data: 'مفيش بيانات توقيت',
  tab_switching: 'تنقّل بين التبويبات أثناء اللعب',
  paste_detected: 'لصق أثناء الدور',
  short_game_many_moves: 'مدة قصيرة جدًا لنقلات كتير',
  perfect_streak: 'سلسلة فوز كاملة',
  server_timed: 'التوقيت مُقاس بساعة السيرفر (دليل أقوى)',
  engine_like_moves: 'نقلات مطابقة لاختيار المحرك',
  low_acpl: 'دقة عالية جدًا مقارنة بالمحرك',
}

const RESULT_LABELS: Record<string, string> = { win: 'كسب', loss: 'خسر', draw: 'تعادل' }

const HINT_LABELS: Record<string, string> = {
  multi_flagged: 'أدوار متعلّمة متكررة',
  engine_consistent: 'تطابق ثابت مع المحرك عبر أدوار متعددة',
  abandon_pattern: 'نمط هجر متكرر للماتشات',
  linked_accounts: 'حسابات مرتبطة بنفس الجهاز أو الشبكة',
}

const VIA_LABELS: Record<string, string> = { ip: 'نفس الشبكة', device: 'نفس الجهاز' }

/** mini bar chart of per-move think times (ms), RTL, pure CSS */
function TimingChart({ times, trusted }: { times: number[]; trusted: boolean }) {
  const shown = times.slice(0, 80)
  const max = Math.max(1000, ...shown)
  return (
    <div className="mt-2 rounded-lg bg-surface px-3 py-2">
      <div className="flex h-10 items-end gap-px" dir="ltr" aria-hidden>
        {shown.map((t, i) => (
          <div
            key={i}
            title={`${(t / 1000).toFixed(1)}s`}
            className={`min-w-[2px] flex-1 rounded-sm ${t < 700 ? 'bg-danger/70' : 'bg-gold/60'}`}
            style={{ height: `${Math.max(6, Math.round((t / max) * 100))}%` }}
          />
        ))}
      </div>
      <p className="mt-1 text-[10px] text-muted">
        توقيت كل نقلة ({trusted ? 'مقاس بساعة السيرفر - غير قابل للتزوير' : 'مقاس من جهاز اللاعب - أقل موثوقية'}) · الأحمر تحت 0.7 ثانية
      </p>
    </div>
  )
}

function scoreTone(score: number): 'danger' | 'gold' | 'muted' {
  if (score >= 70) return 'danger'
  if (score >= 50) return 'gold'
  return 'muted'
}

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('ar-EG-u-nu-latn', { timeZone: 'Africa/Cairo', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))

export default function AdminAntiCheat() {
  const [flags, setFlags] = useState<api.AntiCheatFlag[] | null>(null)
  const [counts, setCounts] = useState({ flagged: 0, dismissed: 0, confirmed: 0 })
  const [excluded, setExcluded] = useState<{ id: number; name: string; email: string }[]>([])
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState<number | null>(null)
  const [links, setLinks] = useState<{ a: { id: number; name?: string }; b: { id: number; name?: string }; via: 'ip' | 'device'; shared: number }[]>([])
  const [summaries, setSummaries] = useState<Record<number, api.AntiCheatSummary | 'loading' | 'error'>>({})
  const [batch, setBatch] = useState<{ done: number; total: number } | null>(null)
  const engineRef = useRef<Engine | null>(null)

  function toggleSummary(userId: number) {
    if (summaries[userId]) {
      setSummaries((cur) => {
        const next = { ...cur }
        delete next[userId]
        return next
      })
      return
    }
    setSummaries((cur) => ({ ...cur, [userId]: 'loading' }))
    api.adminAntiCheatUserSummary(userId)
      .then((d) => setSummaries((cur) => (cur[userId] === 'loading' ? { ...cur, [userId]: d.summary } : cur)))
      .catch(() => setSummaries((cur) => (cur[userId] === 'loading' ? { ...cur, [userId]: 'error' } : cur)))
  }

  async function analyzeAll() {
    if (!flags || batch) return
    const pending = flags.filter((f) => !f.engine)
    if (pending.length === 0) return
    setBatch({ done: 0, total: pending.length })
    for (let i = 0; i < pending.length; i++) {
      try {
        const { game } = await api.adminAntiCheatGame(pending[i].game_id)
        if (game.pgn) {
          if (!engineRef.current) engineRef.current = new Engine()
          const analysis = await analyzePgnWithEngine(game.pgn, game.color === 'black' ? 'b' : 'w', engineRef.current)
          if (analysis.positions > 0) await api.adminAntiCheatSubmitAnalysis(pending[i].game_id, analysis)
        }
      } catch {
        // skip this one; the admin can retry individually
      }
      setBatch({ done: i + 1, total: pending.length })
    }
    setBatch(null)
    load()
  }

  async function analyze(gameId: number) {
    setBusy(gameId)
    try {
      const { game } = await api.adminAntiCheatGame(gameId)
      if (!game.pgn) return
      if (!engineRef.current) engineRef.current = new Engine()
      const analysis = await analyzePgnWithEngine(game.pgn, game.color === 'black' ? 'b' : 'w', engineRef.current)
      if (analysis.positions > 0) await api.adminAntiCheatSubmitAnalysis(gameId, analysis)
      load()
    } catch {
      // keep the list as-is; the admin can retry
    } finally {
      setBusy(null)
    }
  }

  const load = useCallback(() => {
    setFailed(false)
    Promise.all([api.adminAntiCheatFlags('flagged'), api.adminAntiCheatExcluded(), api.adminAntiCheatLinks().catch(() => ({ links: [] }))])
      .then(([f, e, l]) => {
        setFlags(f.flags)
        setCounts(f.counts)
        setExcluded(e.excluded)
        setLinks(l.links)
      })
      .catch(() => setFailed(true))
  }, [])

  useEffect(() => load(), [load])

  async function act(gameId: number, fn: () => Promise<unknown>) {
    setBusy(gameId)
    try {
      await fn()
      load()
    } catch {
      // keep the list as-is; the admin can retry
    } finally {
      setBusy(null)
    }
  }

  return (
    <section aria-labelledby="adm-anticheat">
      <h2 className="mb-3 font-display text-xl font-bold">مكافحة الغش</h2>

      <Card className="mb-3 border border-line p-4">
        <p className="text-xs leading-relaxed text-muted">
          النظام ده مؤشر للمراجعة مش حكم: مفيش كشف غش مضمون 100%، وممكن لاعب بريء يتعلّم بالغلط (موبايل بطيء، تركيز عالي، دور معاد تحليله).
          راجع الدور بنفسك قبل أي إجراء، وكل الإجراءات هنا ناعمة وقابلة للتراجع: علامة مراجعة أو استبعاد مؤقت من المتصدرين - مفيش حظر تلقائي ولا مسح لأي حاجة.
          للأمانة: chess.com عندها موديلات كشف خاصة وداتا ملايين الماتشات وسيرفرات بتشغّل محركات باستمرار - إحنا بنستخدم قواعد واضحة + توقيت السيرفر في الماتشات اللايف + تحليل ستوكفيش عند الطلب. ده بيلقط الغشاشين الواضحين كويس، ومش هيلقط المحترف اللي بيغش بذكاء في نقلتين تلاتة بس.
        </p>
      </Card>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone={counts.flagged > 0 ? 'danger' : 'muted'}>
          مستني مراجعة: <bdi className="ltr">{counts.flagged}</bdi>
        </Badge>
        <Badge tone="muted">
          اتأكد: <bdi className="ltr">{counts.confirmed}</bdi>
        </Badge>
        <Badge tone="muted">
          اتجاهل: <bdi className="ltr">{counts.dismissed}</bdi>
        </Badge>
        {flags && flags.some((f) => !f.engine) && (
          <button
            type="button"
            disabled={batch !== null}
            onClick={analyzeAll}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold transition hover:text-ink disabled:opacity-40"
          >
            <Icon name="search" className="h-4 w-4" />
            {batch ? `بيحلّل ${batch.done}/${batch.total}…` : 'حلّل الكل بالمحرك'}
          </button>
        )}
      </div>

      {links.length > 0 && (
        <Card className="mb-3 border border-gold/30 p-4">
          <p className="mb-2 text-xs font-bold">حسابات مرتبطة (نفس الجهاز أو الشبكة - للمراجعة مش إثبات):</p>
          <ul className="flex flex-col gap-1 text-xs text-muted">
            {links.map((l, i) => (
              <li key={i}>
                {l.a.name ?? `#${l.a.id}`} ↔ {l.b.name ?? `#${l.b.id}`} · {VIA_LABELS[l.via] ?? l.via}
                {l.shared > 1 && <> · {l.shared} إشارات مشتركة</>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {failed && (
        <Card className="border border-danger/30 p-6 text-center">
          <p className="text-sm text-muted">مش قادرين نوصل لقائمة الغش دلوقتي - ممكن الـ API لسه ماتحدّثش. جرّب «حدّث» بعد شوية.</p>
        </Card>
      )}

      {!failed && flags === null && <div className="h-40 animate-pulse rounded-2xl bg-surface" />}

      {!failed && flags !== null && flags.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted">مفيش أدوار متعلّمة دلوقتي. كله تمام.</p>
        </Card>
      )}

      {!failed && flags !== null && flags.length > 0 && (
        <ul className="flex flex-col gap-3">
          {flags.map((f) => (
            <li key={f.game_id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-gold-2 to-gold text-xs font-bold text-[#1a1408]" aria-hidden>
                    {f.user.name.trim().charAt(0) || '؟'}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-bold">{f.user.name}</span>
                  <span className="hidden truncate text-xs text-muted sm:block">
                    <bdi className="ltr">{f.user.email}</bdi>
                  </span>
                  <Badge tone={scoreTone(f.risk_score)}>
                    خطورة: <bdi className="ltr">{f.risk_score}</bdi>
                  </Badge>
                </div>

                <p className="mt-2 text-xs text-muted">
                  ضد <bdi className="ltr">{f.game.opponent ?? '؟'}</bdi> · {RESULT_LABELS[f.game.result] ?? f.game.result} · <bdi className="ltr">{f.game.moves}</bdi> نقلة
                  {f.game.duration_seconds !== null && (
                    <>
                      {' '}
                      · <bdi className="ltr">{Math.round(f.game.duration_seconds / 60)}</bdi> دقيقة
                    </>
                  )}{' '}
                  · {fmtDate(f.game.played_at)}
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {f.reasons.map((r) => (
                    <Badge key={r} tone="muted">
                      {REASON_LABELS[r] ?? r}
                    </Badge>
                  ))}
                </div>

                {f.engine && (
                  <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-xs text-muted">
                    تحليل المحرك: تطابق <bdi className="ltr font-bold">{Math.round((f.engine.match ?? 0) * 100)}%</bdi> · أفضل 3 نقلات{' '}
                    <bdi className="ltr font-bold">{Math.round((f.engine.top3 ?? 0) * 100)}%</bdi> · متوسط الخسارة <bdi className="ltr font-bold">{f.engine.acpl}</bdi> نقطة/نقلة
                  </p>
                )}

                {f.timing.move_times && f.timing.move_times.length >= 4 && <TimingChart times={f.timing.move_times} trusted={f.timing.trusted} />}

                {summaries[f.user.id] === 'loading' && <p className="mt-2 text-xs text-muted">بنجيب ملخص اللاعب…</p>}
                {summaries[f.user.id] === 'error' && <p className="mt-2 text-xs text-danger">ملخص اللاعب مش متاح دلوقتي.</p>}
                {typeof summaries[f.user.id] === 'object' && summaries[f.user.id] !== null && (
                  <div className="mt-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted">
                    {(() => {
                      const sm = summaries[f.user.id] as api.AntiCheatSummary
                      return (
                        <>
                          <p>
                            الأدوار: <bdi className="ltr font-bold">{sm.games.total}</bdi> (كسب <bdi className="ltr">{sm.games.wins}</bdi> · آخر 7 أيام{' '}
                            <bdi className="ltr">{sm.games.last7d}</bdi>) · لايف: مكتمل <bdi className="ltr">{sm.live.finished}</bdi> · مهجور{' '}
                            <bdi className="ltr">{sm.live.abandoned}</bdi> · أعلام: <bdi className="ltr">{sm.flags.open}</bdi> مفتوح من{' '}
                            <bdi className="ltr">{sm.flags.total}</bdi>
                            {sm.flags.analyzed > 0 && (
                              <>
                                {' '}
                                · متوسط تطابق المحرك عبر {sm.flags.analyzed} {sm.flags.analyzed === 1 ? 'دور' : 'أدوار'}:{' '}
                                <bdi className="ltr font-bold">{Math.round((sm.flags.avgMatch ?? 0) * 100)}%</bdi>
                              </>
                            )}
                          </p>
                          {sm.signals.linkedAccounts.length > 0 && (
                            <p className="mt-1">
                              حسابات مرتبطة: {sm.signals.linkedAccounts.map((l) => `${l.name} (${VIA_LABELS[l.via] ?? l.via})`).join('، ')}
                            </p>
                          )}
                          {sm.hints.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {sm.hints.map((h) => (
                                <Badge key={h} tone="gold">
                                  {HINT_LABELS[h] ?? h}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSummary(f.user.id)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold transition hover:text-ink"
                  >
                    <Icon name="eye" className="h-4 w-4" />
                    {summaries[f.user.id] ? 'إخفاء الملخص' : 'ملخص اللاعب'}
                  </button>
                  {!f.engine && (
                    <button
                      type="button"
                      disabled={busy === f.game_id}
                      onClick={() => analyze(f.game_id)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold transition hover:text-ink disabled:opacity-40"
                    >
                      <Icon name="search" className="h-4 w-4" />
                      {busy === f.game_id ? 'بيحلّل…' : 'حلّل بالمحرك'}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy === f.game_id}
                    onClick={() => act(f.game_id, () => api.adminAntiCheatReview(f.game_id, 'dismiss', 'راجعته: لاعب بريء'))}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold text-emerald transition hover:brightness-110 disabled:opacity-40"
                  >
                    <Icon name="check" className="h-4 w-4" />
                    بريء (تجاهل)
                  </button>
                  <button
                    type="button"
                    disabled={busy === f.game_id}
                    onClick={() => act(f.game_id, () => api.adminAntiCheatReview(f.game_id, 'confirm', 'راجعته: غش'))}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-danger/30 bg-surface px-3 py-2 text-xs font-bold text-danger transition hover:brightness-110 disabled:opacity-40"
                  >
                    <Icon name="flag" className="h-4 w-4" />
                    تأكيد الغش
                  </button>
                  <button
                    type="button"
                    disabled={busy === f.game_id}
                    onClick={() =>
                      act(f.game_id, () =>
                        excluded.some((e) => e.id === f.user.id) ? api.adminAntiCheatExclude(f.user.id, false) : api.adminAntiCheatExclude(f.user.id, true),
                      )
                    }
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold text-muted transition hover:text-ink disabled:opacity-40"
                  >
                    <Icon name="eye" className="h-4 w-4" />
                    {excluded.some((e) => e.id === f.user.id) ? 'إرجاع للمتصدرين' : 'استبعاد من المتصدرين'}
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {excluded.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-bold text-muted">مستبعدين من المتصدرين دلوقتي</h3>
          <ul className="flex flex-col gap-2">
            {excluded.map((u) => (
              <li key={u.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-bold">{u.name}</span>
                <span className="hidden truncate text-xs text-muted sm:block">
                  <bdi className="ltr">{u.email}</bdi>
                </span>
                <button
                  type="button"
                  onClick={() => act(u.id, () => api.adminAntiCheatExclude(u.id, false))}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold transition hover:text-ink"
                >
                  إرجاع
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
