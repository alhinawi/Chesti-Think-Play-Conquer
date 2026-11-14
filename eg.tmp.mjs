import { Chess } from 'chess.js'
// square rule
let g = new Chess('8/8/8/8/P5k1/8/8/7K w - - 0 1')
for (const u of ['a4a5','g4f5','a5a6','f5e6','a6a7','e6d7','a7a8q']) { if (!g.move(u)) { console.log('square-rule ILLEGAL', u); process.exit(1) } }
console.log('square-rule OK', g.fen())
// arabian mate
g = new Chess('7k/6pp/8/5N2/8/8/7R/6K1 w - - 0 1')
if (!g.move('h2h7') || !g.isCheckmate()) { console.log('arabian FAIL', g.fen()); process.exit(1) }
console.log('arabian OK mate')
// epaulette mate
g = new Chess('3rkr2/8/8/8/8/8/4Q3/4K3 w - - 0 1')
if (!g.move('e2e6') || !g.isCheckmate()) { console.log('epaulette FAIL', g.fen()); process.exit(1) }
console.log('epaulette OK mate')
