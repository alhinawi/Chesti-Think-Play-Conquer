import mined from './trap-strength-mined.json'
import verified from './trap-verified.json'

// قوة كل فخ محسوبة برمجياً من الخط نفسه (chess.js): مات، أو المادة اللي بيخسرها الواقع في الفخ عند آخر الخط.
// المعيار: مات أولاً، وبعدين أكبر مادة مكتسبة، والتعادل يتكسر بالسرعة (عقاب أسرع بعد الغلطة = أقوى).
const BASE: Record<string, { mate: boolean; material: number; plies: number }> = {
  "dutch-rh6-trap": {
    "mate": true,
    "material": 0,
    "plies": 3
  },
  "tennison-trap": {
    "mate": true,
    "material": 0,
    "plies": 7
  },
  "froms-gambit-trap": {
    "mate": true,
    "material": 0,
    "plies": 5
  },
  "balode-sondore-trap": {
    "mate": true,
    "material": 0,
    "plies": 5
  },
  "caro-ne6-trap": {
    "mate": true,
    "material": 0,
    "plies": 1
  },
  "rosen-trap": {
    "mate": true,
    "material": 0,
    "plies": 5
  },
  "monticelli-trap": {
    "mate": true,
    "material": 0,
    "plies": 1
  },
  "vienna-qxf7-trap": {
    "mate": true,
    "material": 0,
    "plies": 1
  },
  "halosar-mate-trap": {
    "mate": true,
    "material": 0,
    "plies": 1
  },
  "fools-mate": {
    "mate": true,
    "material": 0,
    "plies": 1
  },
  "scholars-mate": {
    "mate": true,
    "material": 1,
    "plies": 1
  },
  "legals-mate": {
    "mate": true,
    "material": 2,
    "plies": 3
  },
  "blackburne-shilling": {
    "mate": true,
    "material": 2,
    "plies": 5
  },
  "fishing-pole": {
    "mate": false,
    "material": 1,
    "plies": 5
  },
  "elephant-trap": {
    "mate": false,
    "material": 16,
    "plies": 7
  },
  "englund-trap": {
    "mate": true,
    "material": 4,
    "plies": 5
  },
  "lasker-trap": {
    "mate": false,
    "material": 14,
    "plies": 7
  },
  "noahs-ark": {
    "mate": false,
    "material": 4,
    "plies": 7
  },
  "siberian-trap": {
    "mate": false,
    "material": 2,
    "plies": 1
  },
  "kieninger-trap": {
    "mate": true,
    "material": 1,
    "plies": 1
  },
  "caro-smother": {
    "mate": true,
    "material": 1,
    "plies": 1
  },
  "tarrasch-trap": {
    "mate": false,
    "material": 20,
    "plies": 21
  },
  "halosar-trap": {
    "mate": false,
    "material": 2,
    "plies": 3
  },
  "damiano-trap": {
    "mate": false,
    "material": 7,
    "plies": 9
  },
  "budapest-trap": {
    "mate": true,
    "material": 1,
    "plies": 1
  },
  "tennison-gambit": {
    "mate": false,
    "material": 11,
    "plies": 5
  },
  "rubinstein-trap": {
    "mate": false,
    "material": 5,
    "plies": 3
  },
  "qga-queen-trap": {
    "mate": false,
    "material": 4,
    "plies": 3
  },
  "smith-morra-trap": {
    "mate": false,
    "material": 5,
    "plies": 5
  },
  "boden-kieseritzky": {
    "mate": false,
    "material": 5,
    "plies": 5
  },
  "london-queen-trap": {
    "mate": false,
    "material": 0,
    "plies": 1
  },
  "giuoco-piano-trap": {
    "mate": false,
    "material": 20,
    "plies": 13
  },
  "philidor-trap": {
    "mate": false,
    "material": 14,
    "plies": 7
  },
  "dutch-trap": {
    "mate": true,
    "material": 0,
    "plies": 1
  },
  "magnus-smith-trap": {
    "mate": false,
    "material": 14,
    "plies": 3
  },
  "petrov-trap": {
    "mate": false,
    "material": 10,
    "plies": 3
  },
  "greco-trap": {
    "mate": false,
    "material": 20,
    "plies": 13
  },
  "fajarowicz-trap": {
    "mate": false,
    "material": 12,
    "plies": 5
  },
  "wing-gambit-trap": {
    "mate": false,
    "material": 7,
    "plies": 3
  },
  "reti-tartakower": {"mate":true,"material":0,"plies":5},
  "petrov-nc6-check": {"mate":false,"material":6,"plies":4},
  "hopton-trap": {"mate":true,"material":0,"plies":3},
  "wurzburger-trap": {"mate":false,"material":0,"plies":1}
}

const RAW: Record<string, { mate: boolean; material: number; plies: number }> = { ...BASE, ...mined }

// الفخ مات لو الخط نفسه بينتهي بمات، أو لو Stockfish شايف مات بالقوة في آخر الخط (التقييم 100)
// زي Fishing Pole: الخط بيقف قبل Qh1# بنقلة، بس المات مفيش منه مفر.
const V = verified as Record<string, { end: number }>
export const TRAP_STRENGTH: Record<string, { mate: boolean; material: number; plies: number }> = Object.fromEntries(
  Object.entries(RAW).map(([id, s]) => [id, { ...s, mate: s.mate || (V[id]?.end ?? 0) >= 99 }]),
)
