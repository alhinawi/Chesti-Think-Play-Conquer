// Soft warnings to suspected cheaters. Polite and firm, never an accusation of
// certainty: the message says we saw unusual signals, no action was taken, and
// only a repeated pattern leads to leaderboard exclusion. Auto warnings fire
// when a game's risk crosses the danger tier (70+); the admin can also send one
// with one tap. Rate-limited: at most one warning per user per 7 days, so a
// flagged player is never spammed.

export const WARN_RISK_THRESHOLD = 70
export const WARN_COOLDOWN_DAYS = 7

export const WARNING_MESSAGE =
  'بنحافظ على اللعب النظيف هنا. لاحظنا في دور ليك إشارات غير معتادة - زي نقلات أسرع من الطبيعي أو تطابق عالي مع اختيارات الكمبيوتر. ممكن تكون صدفة أو تركيز عالي، فمفيش أي إجراء اتخذ على حسابك. لو النمط ده اتكرر، ممكن نستبعدك من المتصدرين. خلي فوزك بمجهودك.'

/** Insert a warning when allowed. Returns true when one was created. */
export async function maybeWarn(
  db: D1Database,
  userId: number,
  gameId: number | null,
  riskScore: number | null,
  kind: 'auto' | 'admin',
): Promise<boolean> {
  if (kind === 'auto' && (riskScore === null || riskScore < WARN_RISK_THRESHOLD)) return false
  const recent = await db
    .prepare(
      `SELECT id FROM cheat_warnings WHERE user_id = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)`,
    )
    .bind(userId, `-${WARN_COOLDOWN_DAYS} days`)
    .first()
  if (recent) return false
  await db
    .prepare('INSERT INTO cheat_warnings (user_id, game_id, kind, message, risk_score) VALUES (?, ?, ?, ?, ?)')
    .bind(userId, gameId, kind, WARNING_MESSAGE, riskScore)
    .run()
  return true
}
