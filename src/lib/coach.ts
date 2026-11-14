// "عم حسن", the café chess master who comments on your moves. Pure, so it can be tested.
export const COACH = { name: 'عم حسن', title: 'معلّم الشطرنج بتاع القهوة' }

export interface MoveFacts {
  san: string
  piece: string
  captured?: string
  promotion?: string
  /** chess.js flags: k/q castle, e en passant, p promotion, c capture */
  flags: string
  mate: boolean
  check: boolean
  /** the user's move number (1, 2, ...) */
  moveNo: number
}

const LINES: Record<string, string[]> = {
  mate: ['كش مات! قوم اطلب لنفسك كوباية شاي على حسابي.', 'مات! الله ينور عليك، كده الشغل.'],
  promotion: ['العسكري اترقّى! من عسكري غلبان لوزير، حلم كل عسكري.', 'ترقية! كده الدور بقى في جيبك.'],
  castle: ['بيّتت الملك، كده هو في أمان والطابية طلعت للشغل.', 'تبييت في وقته. الملك قاعد في بيته مرتاح.'],
  enpassant: ['أكل بالمارّة! دي نقلة ناس كتير ماتعرفهاش.'],
  bigCapture: ['أكلة معتبرة! بس اتأكد إنها مش طُعم.', 'يا سلام! قطعة تقيلة راحت عليه.'],
  capture: ['أكلة حلوة.', 'كل واشكر.', 'بالهنا والشفا.'],
  check: ['كش! خليه يتعب شوية.', 'كش محترم، بس فكر هو هيهرب فين.'],
  earlyQueen: ['الوزير طالع بدري ليه؟ استنى لما القطع الصغيرة تطلع الأول.'],
  center: ['افتتاح مظبوط، مسكت النص.', 'كده! النص الأول يا ابني.'],
}

const VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 }

/** A line for the user's move, or null when nothing is worth saying. pick chooses among variants. */
export function coachLine(m: MoveFacts, pick: (n: number) => number = (n) => Math.floor(Math.random() * n)): string | null {
  const say = (k: string) => LINES[k][pick(LINES[k].length) % LINES[k].length]
  if (m.mate) return say('mate')
  if (m.flags.includes('p') || m.promotion) return say('promotion')
  if (m.flags.includes('k') || m.flags.includes('q')) return say('castle')
  if (m.flags.includes('e')) return say('enpassant')
  if (m.captured && VALUE[m.captured] >= 5) return say('bigCapture')
  if (m.check) return say('check')
  if (m.piece === 'q' && m.moveNo <= 3) return say('earlyQueen')
  if (m.captured) return say('capture')
  if (m.moveNo === 1 && /^[ed][45]$/.test(m.san)) return say('center')
  return null
}
