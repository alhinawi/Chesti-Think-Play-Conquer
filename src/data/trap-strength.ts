import mined from './trap-strength-mined.json'

// قوة كل فخ محسوبة برمجياً من الخط نفسه (chess.js): مات، أو المادة اللي بيخسرها الواقع في الفخ عند آخر الخط.
// المعيار: مات أولاً، وبعدين أكبر مادة مكتسبة، والتعادل يتكسر بالسرعة (عقاب أسرع بعد الغلطة = أقوى).
const BASE: Record<string, { mate: boolean; material: number; plies: number }> = {
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
  "mortimer-trap": {
    "mate": false,
    "material": 0,
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
  "marshall-trap": {
    "mate": false,
    "material": 3,
    "plies": 3
  },
  "fried-liver": {
    "mate": false,
    "material": 2,
    "plies": 7
  },
  "traxler": {
    "mate": false,
    "material": 4,
    "plies": 9
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
  "stafford-gambit": {
    "mate": false,
    "material": 7,
    "plies": 3
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
  "owen-trap": {
    "mate": true,
    "material": 3,
    "plies": 3
  },
  "evans-gambit": {
    "mate": false,
    "material": 1,
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
  "smyslov-caro-trap": {
    "mate": false,
    "material": 3,
    "plies": 5
  },
  "french-advance-trap": {
    "mate": false,
    "material": 16,
    "plies": 5
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
  "wayward-queen-trap": {
    "mate": false,
    "material": 12,
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
  "tarrasch-dresden": {"mate":false,"material":1,"plies":7},
  "wurzburger-trap": {"mate":false,"material":0,"plies":1}
}

export const TRAP_STRENGTH: Record<string, { mate: boolean; material: number; plies: number }> = { ...BASE, ...mined }
