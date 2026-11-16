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
  engine_like_moves: 'نقلات مطابقة لاختيار المحرك',
  low_acpl: 'دقة عالية جدًا مقارنة بالمحرك',
}

const RESULT_LABELS: Record<string, string> = { win: 'كسب', loss: 'خسر', draw: 'تعادل' }

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
  const engineRef = useRef<Engine | null>(null)

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
    Promise.all([api.adminAntiCheatFlags('flagged'), api.adminAntiCheatExcluded()])
      .then(([f, e]) => {
        setFlags(f.flags)
        setCounts(f.counts)
        setExcluded(e.excluded)
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
      </div>

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

                <div className="mt-3 flex flex-wrap gap-2">
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
