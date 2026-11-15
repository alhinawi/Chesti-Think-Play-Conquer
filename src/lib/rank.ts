// XP, ranks, streaks and achievements, all worked out from the saved progress (nothing extra stored).
import type { Progress } from './progress'

export const XP = { lesson: 50, puzzle: 20, trap: 30, opening: 25, endgame: 30, daily: 40, game: 10, win: 40, guessMaster: 40 }

export const RANKS = [
  { xp: 0, name: 'عسكري غلبان', icon: '♟' },
  { xp: 150, name: 'حصان طيّار', icon: '♞' },
  { xp: 400, name: 'فيل حكيم', icon: '♝' },
  { xp: 800, name: 'طابية حديد', icon: '♜' },
  { xp: 1400, name: 'وزير فتّاك', icon: '♛' },
  { xp: 2200, name: 'المعلم', icon: '♚' },
  { xp: 3500, name: 'استاذ', icon: '♚' },
  { xp: 5000, name: 'رئيس قسم', icon: '♔' },
  { xp: 7000, name: 'جراند ماستر', icon: '♔' },
  { xp: 10000, name: 'فخر العرب', icon: '♔' },
] as const

export function totalWins(p: Progress) {
  return Object.values(p.wins || {}).reduce((a, b) => a + b, 0)
}

export function xpOf(p: Progress) {
  const games = p.games || 0
  return p.lessons.length * XP.lesson + p.puzzles.length * XP.puzzle + p.traps.length * XP.trap + (p.openings?.length || 0) * XP.opening + (p.endgames?.length || 0) * XP.endgame + (p.daily || []).length * XP.daily + games * XP.game + totalWins(p) * XP.win + Object.values(p.guesses || {}).filter((g) => g.hits >= Math.ceil(g.total * 0.7)).length * XP.guessMaster
}

export function rankOf(xp: number) {
  let i = 0
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++
  const cur = RANKS[i]
  const next = RANKS[i + 1]
  const pct = next ? Math.round(((xp - cur.xp) / (next.xp - cur.xp)) * 100) : 100
  return { index: i, ...cur, next, pct }
}

const dayNum = (d: string) => Math.round(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86400000)

/** Days in a row with activity, ending today (or yesterday, so the streak survives until tonight). */
export function streakOf(days: string[], todayStr: string) {
  const set = new Set(days.map(dayNum))
  let n = dayNum(todayStr)
  if (!set.has(n)) n -= 1
  let streak = 0
  while (set.has(n)) {
    streak++
    n--
  }
  return streak
}

export function bestStreakOf(days: string[]) {
  const nums = [...new Set(days.map(dayNum))].sort((a, b) => a - b)
  let best = 0
  let run = 0
  for (let i = 0; i < nums.length; i++) {
    run = i > 0 && nums[i] === nums[i - 1] + 1 ? run + 1 : 1
    best = Math.max(best, run)
  }
  return best
}

export interface Achievement {
  id: string
  name: string
  desc: string
  icon: string
  test: (p: Progress, totals: { lessons: number; traps: number; puzzles: number; openings: number; endgames: number }) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-lesson', name: 'أول الغيث', desc: 'خلّص أول درس', icon: '📖', test: (p) => p.lessons.length >= 1 },
  { id: 'five-lessons', name: 'تلميذ شاطر', desc: 'خلّص 5 دروس', icon: '🎓', test: (p) => p.lessons.length >= 5 },
  { id: 'all-lessons', name: 'خريج الأكاديمية', desc: 'خلّص كل الدروس', icon: '🏛️', test: (p, t) => p.lessons.length >= t.lessons },
  { id: 'first-puzzle', name: 'فكّ اللغز', desc: 'حل أول لغز', icon: '🧩', test: (p) => p.puzzles.length >= 1 },
  { id: 'ten-puzzles', name: 'مخ شغال', desc: 'حل 10 ألغاز', icon: '🧠', test: (p) => p.puzzles.length >= 10 },
  { id: 'thirty-puzzles', name: 'جهاز كمبيوتر', desc: 'حل 30 لغز', icon: '⚡', test: (p) => p.puzzles.length >= 30 },
  { id: 'first-trap', name: 'صياد مبتدئ', desc: 'اتعلم أول فخ', icon: '🪤', test: (p) => p.traps.length >= 1 },
  { id: 'all-traps', name: 'ثعلب الافتتاحات', desc: 'اتعلم كل الفخاخ', icon: '🦊', test: (p, t) => p.traps.length >= t.traps },
  { id: 'first-win', name: 'أول نصر', desc: 'اكسب الكمبيوتر أول مرة', icon: '🏆', test: (p) => totalWins(p) >= 1 },
  { id: 'beat-kasparov', name: 'كسرت الأسطورة', desc: 'اكسب Kasparov أو حد أقوى منه', icon: '⚔️', test: (p) => ['kasparov', 'nakamura', 'carlsen'].some((b) => (p.wins?.[b] || 0) > 0) },
  { id: 'beat-carlsen', name: 'هزمت البطل', desc: 'اكسب Magnus Carlsen (المستوى 8)', icon: '💪', test: (p) => (p.wins?.['carlsen'] || 0) > 0 },
  { id: 'daily-3', name: 'مواظب', desc: 'حل لغز اليوم 3 مرات', icon: '📅', test: (p) => (p.daily || []).length >= 3 },
  { id: 'streak-3', name: 'نار ولعة', desc: '3 أيام ورا بعض', icon: '🔥', test: (p) => bestStreakOf(p.days || []) >= 3 },
  { id: 'streak-7', name: 'أسبوع كامل', desc: '7 أيام ورا بعض', icon: '🌟', test: (p) => bestStreakOf(p.days || []) >= 7 },
  { id: 'ten-lessons', name: 'عاشر درس', desc: 'خلّص 10 دروس', icon: '✏️', test: (p) => p.lessons.length >= 10 },
  { id: 'twenty-lessons', name: 'نص الطريق', desc: 'خلّص 20 درس', icon: '🧭', test: (p) => p.lessons.length >= 20 },
  { id: 'half-lessons', name: 'نص المكتبة', desc: 'خلّص نص الدروس', icon: '📚', test: (p, t) => p.lessons.length >= Math.ceil(t.lessons / 2) },
  { id: 'twenty-puzzles', name: 'فكّاك الألغاز', desc: 'حل 20 لغز', icon: '🔓', test: (p) => p.puzzles.length >= 20 },
  { id: 'fifty-puzzles', name: 'نص المية', desc: 'حل 50 لغز', icon: '💡', test: (p) => p.puzzles.length >= 50 },
  { id: 'hundred-puzzles', name: 'مية مية', desc: 'حل 100 لغز', icon: '💯', test: (p) => p.puzzles.length >= 100 },
  { id: 'five-traps', name: 'جامع الفخاخ', desc: 'اتعلم 5 فخاخ', icon: '🎯', test: (p) => p.traps.length >= 5 },
  { id: 'half-traps', name: 'صياد محترف', desc: 'اتعلم نص الفخاخ', icon: '🏹', test: (p, t) => p.traps.length >= Math.ceil(t.traps / 2) },
  { id: 'daily-7', name: 'عادة يومية', desc: 'حل لغز اليوم 7 مرات', icon: '🗓️', test: (p) => (p.daily || []).length >= 7 },
  { id: 'daily-30', name: 'جزء من اليوم', desc: 'حل لغز اليوم 30 مرة', icon: '📆', test: (p) => (p.daily || []).length >= 30 },
  { id: 'streak-14', name: 'أسبوعين نار', desc: '14 يوم ورا بعض', icon: '☄️', test: (p) => bestStreakOf(p.days || []) >= 14 },
  { id: 'streak-30', name: 'شهر كامل', desc: '30 يوم ورا بعض', icon: '🏅', test: (p) => bestStreakOf(p.days || []) >= 30 },
  { id: 'ten-games', name: 'مجرب جاد', desc: 'العب 10 أدوار ضد الكمبيوتر', icon: '🎮', test: (p) => (p.games || 0) >= 10 },
  { id: 'fifty-games', name: 'ابن الترابيزة', desc: 'العب 50 دور ضد الكمبيوتر', icon: '🕹️', test: (p) => (p.games || 0) >= 50 },
  { id: 'wins-10', name: '10 انتصارات', desc: 'اكسب 10 أدوار ضد الكمبيوتر', icon: '🥇', test: (p) => totalWins(p) >= 10 },
  { id: 'three-bots', name: 'هات التالتة', desc: 'اكسب 3 أبطال مختلفين', icon: '🧹', test: (p) => Object.values(p.wins || {}).filter((n) => n > 0).length >= 3 },
  { id: 'first-opening', name: 'الدور اتفتح', desc: 'اتعلم أول افتتاحية', icon: '🚪', test: (p) => (p.openings?.length || 0) >= 1 },
  { id: 'six-openings', name: 'جعبة جاهزة', desc: 'اتعلم 6 افتتاحيات', icon: '🎒', test: (p) => (p.openings?.length || 0) >= 6 },
  { id: 'all-openings', name: 'سيد المبادي', desc: 'اتعلم كل الافتتاحيات في المكتبة', icon: '📜', test: (p, t) => (p.openings?.length || 0) >= t.openings },
  { id: 'first-endgame', name: 'نهاية سعيدة', desc: 'حل أول موقف من معمل النهايات', icon: '🏁', test: (p) => (p.endgames?.length || 0) >= 1 },
  { id: 'all-endgames', name: 'طبيب النهايات', desc: 'حل كل مواقف معمل النهايات', icon: '🩺', test: (p, t) => (p.endgames?.length || 0) >= t.endgames },
  { id: 'first-guess', name: 'بروح الأبطال', desc: 'كمّل أول دور في وضع خمّن النقلة', icon: '🔮', test: (p) => Object.keys(p.guesses || {}).length >= 1 },
  { id: 'guess-ace', name: 'عارف الأدوار', desc: 'خمّن 70% أو أكتر من نقلات البطل في دور واحد', icon: '🧿', test: (p) => Object.values(p.guesses || {}).some((g) => g.hits >= Math.ceil(g.total * 0.7)) },
  { id: 'guess-perfect', name: 'وحش التخمين', desc: 'خمّن دور كامل صح من أول مرة بالكامل', icon: '🎯', test: (p) => Object.values(p.guesses || {}).some((g) => g.total > 0 && g.hits === g.total) },
  { id: 'all-bots', name: 'قاهر الأبطال', desc: 'اكسب كل الأبطال التمانية', icon: '👑', test: (p) => ['lasker', 'capablanca', 'botvinnik', 'polgar', 'fischer', 'kasparov', 'nakamura', 'carlsen'].every((b) => (p.wins?.[b] || 0) > 0) },
]

/** Same puzzle for everyone on the same local date. */
export function dailyIndex(date: string, count: number) {
  let h = 2166136261
  for (const ch of `chesti-${date}`) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % count
}
