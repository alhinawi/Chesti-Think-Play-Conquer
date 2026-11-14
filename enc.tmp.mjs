import { Chess } from 'chess.js'
const tests = [
  ['greek-gift', 'r1bq1rk1/pppn1ppp/4p3/3p4/3P4/3B1N2/PPP2PPP/RNBQ1RK1 w - - 0 1', ['Bxh7+','Kxh7','Ng5+','Kg8','Qh5']],
  ['windmill', 'r2q1rk1/ppp2ppp/8/8/6R1/8/1B4PP/6K1 w - - 0 1', ['Rxg7+','Kh8','Rxf7+','Kg8','Rg7+','Kh8','Rxc7+','Kg8','Rg7+','Kh8','Rxb7+','Kg8','Rg7+','Kh8','Rxa7+']],
  ['back-rank', '6k1/5ppp/8/8/8/8/8/Q5K1 w - - 0 1', ['Qe8#']],
]
for (const [id, fen, sans] of tests) {
  const g = new Chess(fen)
  for (const s of sans) { if (!g.move(s)) { console.log(id, 'ILLEGAL:', s, g.fen()); process.exit(1) } }
  console.log(id, 'OK')
}
