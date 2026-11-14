import { Chess } from 'chess.js'
const fried = 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7 Kxf7 Qf3+ Ke6 Nc3 Nb4 O-O'.split(' ')
const traxler = 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 Bc5 Nxf7 Bxf2+ Kxf2 Nxe4+ Kg1 Qh4 g3 Nxg3 hxg3 Qxg3+ Kh1 Rf8'.split(' ')
for (const [id, sans] of [['fried', fried], ['traxler', traxler]]) {
  const g = new Chess()
  for (const s of sans) { if (!g.move(s)) { console.log(id, 'ILLEGAL:', s); process.exit(1) } }
  console.log(id, 'OK', sans.length)
}
