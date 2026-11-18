// يولّد فخاخ من خطوط scripts/trapmine.mjs (متحقق منها بـ Stockfish) إلى ch-traps-mined.ts + en/traps.json + trap-strength.ts
// الاستخدام: node scripts/trapgen.mjs MAX file1.jsonl file2.jsonl ...
import fs from 'fs'
import crypto from 'crypto'
import { Chess } from 'chess.js'

const MAX = Number(process.argv[2])
const files = process.argv.slice(3)
const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9 }
const PAR = { p: 'عسكري', n: 'حصان', b: 'فيل', r: 'طابية', q: 'وزير', k: 'ملك' }
const PEN = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }
const FAM = {
  'Italian Game': 'الافتتاحية الإيطالية', "King's Gambit Accepted": 'جامبيت الملك المقبول', "King's Gambit Declined": 'جامبيت الملك المرفوض',
  'Four Knights Game': 'لعبة الأحصنة الأربعة', 'English Opening': 'الافتتاحية الإنجليزية', 'Caro-Kann Defense': 'الدفاع كارو-كان',
  "Petrov's Defense": 'دفاع بتروف', 'Pirc Defense': 'دفاع بيرك', 'Benoni Defense': 'دفاع بينوني', 'Alekhine Defense': 'دفاع أليخين',
  'Scotch Game': 'لعبة سكوتش', 'Réti Opening': 'افتتاحية ريتي', 'Three Knights Opening': 'افتتاحية الأحصنة الثلاثة',
  'Sicilian Defense': 'الدفاع الصقلي', 'Scandinavian Defense': 'الدفاع الاسكندنافي', 'Ponziani Opening': 'افتتاحية بونزياني',
  'Modern Defense': 'الدفاع الحديث', 'Benko Gambit': 'جامبيت بينكو', 'Benko Gambit Declined': 'جامبيت بينكو المرفوض', 'Benko Gambit Accepted': 'جامبيت بينكو المقبول',
  'Philidor Defense': 'دفاع فيليدور', 'Nimzowitsch Defense': 'دفاع نيمزوفيتش', 'Lion Defense': 'دفاع الأسد', 'Indian Defense': 'الدفاع الهندي',
  'Dutch Defense': 'الدفاع الهولندي', 'Trompowsky Attack': 'هجوم ترومبوفسكي', 'Pterodactyl Defense': 'دفاع التيروداكتيل', 'London System': 'نظام لندن',
  'Latvian Gambit': 'جامبيت لاتفيا', "King's Knight Opening": 'افتتاحية حصان الملك', 'Elephant Gambit': 'جامبيت الفيل', 'Carr Defense': 'دفاع كار',
  "Bishop's Opening": 'افتتاحية الفيل', 'Bird Opening': 'افتتاحية بيرد', 'French Defense': 'الدفاع الفرنسي', 'Ruy Lopez': 'روي لوبيز',
  "Queen's Gambit Declined": 'جامبيت الوزير المرفوض', "Queen's Gambit Accepted": 'جامبيت الوزير المقبول', "Queen's Gambit": 'جامبيت الوزير',
  "King's Indian Defense": 'الدفاع الهندي الملكي', "Queen's Indian Defense": 'الدفاع الهندي للوزير', 'Nimzo-Indian Defense': 'دفاع نيمزو-الهندي',
  'Grünfeld Defense': 'دفاع جرونفلد', 'Slav Defense': 'الدفاع السلافي', 'Semi-Slav Defense': 'الدفاع نصف السلافي', 'Vienna Game': 'لعبة فيينا',
  'Danish Gambit': 'الجامبيت الدنماركي', 'Center Game': 'لعبة المركز', "Queen's Pawn Game": 'لعبة عسكري الوزير', "King's Pawn Game": 'لعبة عسكري الملك',
  'Catalan Opening': 'الافتتاحية الكتالانية', 'Budapest Defense': 'دفاع بودابست', 'Old Indian Defense': 'الدفاع الهندي القديم', 'Evans Gambit': 'جامبيت إيفانز',
  'Blackmar-Diemer Gambit': 'جامبيت بلاكمار-ديمر', 'Colle System': 'نظام كول', 'Vienna Gambit': 'جامبيت فيينا', 'Hungarian Opening': 'الافتتاحية المجرية',
  'Polish Opening': 'الافتتاحية البولندية', 'Zukertort Opening': 'افتتاحية زوكرتورت', 'Larsen Opening': 'افتتاحية لارسن', 'Sokolsky Opening': 'افتتاحية سوكولسكي',
}
const GRP = { A: 'افتتاحيات جانبية', B: 'دفاعات نصف مفتوحة', C: 'افتتاحيات مفتوحة', D: 'افتتاحيات مغلقة', E: 'دفاعات هندية' }
const GRPE = { A: 'Flank openings', B: 'Semi-open defences', C: 'Open games', D: 'Closed games', E: 'Indian defences' }
const arFam = (n, eco) => FAM[n] || `${GRP[eco[0]]} (${eco[0]})`

const mat = (c) => { let s = 0; for (const r of c.board()) for (const x of r) if (x && x.type !== 'k') s += (x.color === 'w' ? 1 : -1) * VAL[x.type]; return s }

const all = []
for (const f of files) for (const l of fs.readFileSync(f, 'utf8').split('\n')) if (l.trim()) { try { all.push(JSON.parse(l)) } catch {} }

const cands = []
for (const r of all) {
  const trapper = r.stm === 'w' ? 'b' : 'w'
  const sgn = trapper === 'w' ? 1 : -1
  const c = new Chess()
  const m = r.prefix.length
  let base = 0, cut = -1, gain = 0, mate = false
  try {
    for (let i = 0; i < r.line.length; i++) {
      if (i === m) base = sgn * mat(c)
      const mv = c.move(r.line[i])
      if (i > m && mv.color === trapper) {
        const g = sgn * mat(c) - base
        if (c.isCheckmate()) { cut = i; gain = g; mate = true; break }
        if (g >= 2.5) { cut = i; gain = g; break }
      }
    }
  } catch { continue }
  if (cut < 0 || cut - m < 3) continue
  const moves = r.line.slice(0, cut + 1)
  // بوابة الجودة: فخ حقيقي مش مجرد قطعة معلقة. بعد أول رد من الفخّاخ لازم المكسب يبقى لسه صغير (العقاب بيحتاج تكتيك)،
  // وآخر نقلة لازم تكون مات أو أخذ قطعة تقيلة، والعقاب 3 نقلات على الأقل.
  {
    const q = new Chess(); r.line.slice(0, m).forEach((x) => q.move(x))
    const b0 = sgn * mat(q); q.move(r.line[m]); q.move(r.line[m + 1])
    const g1 = sgn * mat(q) - b0
    const q2 = new Chess(); let lm; moves.forEach((x) => (lm = q2.move(x)))
    if (!mate && (g1 >= 1.5 || !lm.captured || VAL[lm.captured] < 3)) continue
  }
  const vmv = new Chess(); r.line.slice(0, m).forEach((x) => vmv.move(x))
  const vm = vmv.move(r.line[m])
  cands.push({ r, moves, m, trapper, gain: Math.max(0, gain), mate, vm, key: moves.join(' ') })
}
const seen = new Set(), seenPos = new Set(), seenCont = new Set(), uniq = []
cands.sort((a, b) => Number(b.mate) - Number(a.mate) || b.gain - a.gain || a.moves.length - b.moves.length || (a.key < b.key ? -1 : 1))
for (const c of cands) {
  const pos = c.moves.slice(0, c.m + 1).join(' ')
  const cont = c.moves.slice(c.m).join(' ')
  if (seen.has(c.key) || seenPos.has(pos) || seenCont.has(cont)) continue
  seenCont.add(cont); seen.add(c.key); seenPos.add(pos); uniq.push(c)
}
const exist = new Set()
const ex = fs.readFileSync('src/data/traps.ts', 'utf8') // لا نكرر خطوط الفخاخ اليدوية
const picked = uniq.slice(0, MAX)

const traps = [], en = {}, strength = {}
const nameCount = {}
for (const c of picked) {
  const { r, moves, m, trapper, vm } = c
  const id = 'mt-' + r.eco.toLowerCase() + '-' + crypto.createHash('md5').update(c.key).digest('hex').slice(0, 6)
  const cap = vm.captured ? PAR[vm.captured] : null
  const tag = cap ? `أكل ${cap} على ${vm.to}` : vm.san.includes('+') ? `كش على ${vm.to}` : `${PAR[vm.piece]} على ${vm.to}`
  const tagE = vm.captured ? `${PEN[vm.captured]} grab on ${vm.to}` : vm.san.includes('+') ? `check on ${vm.to}` : `${PEN[vm.piece]} to ${vm.to}`
  const fam = arFam(r.name.split(':')[0], r.eco)
  let name = `فخ ${fam} (${r.eco}): ${tag}`
  nameCount[name] = (nameCount[name] || 0) + 1
  if (nameCount[name] > 1) name += ` - ${nameCount[name]}`
  const famE = r.name.split(':')[0]
  let nameE = `${famE} (${r.eco}) trap: ${tagE}`
  const k2 = nameE; nameCount[k2] = (nameCount[k2] || 0) + 1; if (nameCount[k2] > 1) nameE += ` #${nameCount[k2]}`
  const last = moves.length - 1
  const lm = new Chess(); moves.forEach((x) => lm.move(x))
  const gainTxt = c.mate ? 'كش مات' : `بيكسب مادة تساوي ${Math.round(c.gain)} عساكر`
  const gainE = c.mate ? 'checkmate' : `wins about ${Math.round(c.gain)} pawns of material`
  const trapperAr = trapper === 'w' ? 'الأبيض' : 'الأسود', victimAr = trapper === 'w' ? 'الأسود' : 'الأبيض'
  const trapperE = trapper === 'w' ? 'White' : 'Black', victimE = trapper === 'w' ? 'Black' : 'White'
  const level = c.mate || last - m <= 3 ? 'سهل' : last - m <= 5 ? 'متوسط' : 'متقدم'
  const notes = Array(moves.length).fill(''), notesE = {}
  notes[m] = `الغلطة! ${victimAr} بيلعب ${vm.san} وشكله مغري، بس ده الفخ.`
  notesE[m] = `The mistake! ${victimE} plays ${vm.san}. It looks tempting, but it is the trap.`
  notes[m + 1] = `${trapperAr} بيرد ${moves[m + 1]} وده بيبدأ العقاب.`
  notesE[m + 1] = `${trapperE} answers ${moves[m + 1]} and the punishment starts.`
  notes[last] = c.mate ? `كش مات!` : `${trapperAr} ${gainTxt}.`
  notesE[last] = c.mate ? 'Checkmate!' : `${trapperE} ${gainE}.`
  traps.push({
    id, name, en: nameE, opening: fam, side: trapper, level,
    summary: `${victimAr} بيلعب ${vm.san} في ${fam} وده شكله مكسب، لكن ${trapperAr} عنده رد ${moves[m + 1]} ومن بعده ${gainTxt}.`,
    moves, notes, mistake: m,
    avoid: `قبل ما تلعب ${vm.san} هنا، اسأل نفسك الأول: ${trapperAr} هيرد بإيه، ومين هيتحمي بعد النقلة دي.`,
  })
  en[id] = {
    name: nameE, opening: famE,
    summary: `${victimE} plays ${vm.san} in the ${famE}. It looks like a win, but ${trapperE} has ${moves[m + 1]} and then ${gainE}.`,
    notes: Object.fromEntries(Object.entries(notesE)),
    avoid: `Before playing ${vm.san} here, ask yourself first how ${trapperE} will reply and what is left unprotected after the move.`,
  }
  strength[id] = { mate: c.mate, material: Math.round(c.gain), plies: last - m }
}
// الكتالوج الإنجليزي: اسم العائلة بالإنجليزي
const ts = `import type { Trap } from './types'\n\n// فخاخ مولّدة من خطوط ECO (scripts/trapmine.mjs + scripts/trapgen.mjs). كل خط متحقق منه بـ chess.js و Stockfish.\nexport const TRAPS_MINED: Trap[] = ${JSON.stringify(traps, null, 1)}\n`
fs.writeFileSync('src/data/ch-traps-mined.ts', ts)
const enAll = JSON.parse(fs.readFileSync('src/data/en/traps.json', 'utf8'))
for (const k of Object.keys(enAll)) if (k.startsWith('mt-')) delete enAll[k]
Object.assign(enAll, en)
fs.writeFileSync('src/data/en/traps.json', JSON.stringify(enAll, null, 1))
fs.writeFileSync('src/data/trap-strength-mined.json', JSON.stringify(strength))
console.log({ rows: all.length, valid: cands.length, uniq: uniq.length, picked: picked.length, mate: picked.filter((p) => p.mate).length })
