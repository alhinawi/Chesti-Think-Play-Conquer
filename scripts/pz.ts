import { Chess } from 'chess.js'
import { writeFileSync } from 'node:fs'
const fromGame = (moves: string) => { const g = new Chess(); moves.split(' ').filter(Boolean).forEach((m) => g.move(m)); return g.fen() }
const C: Record<string, string> = {
  backrank: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
  arabian: '7k/R7/5N2/8/8/8/8/6K1 w - - 0 1',
  smothered: '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1',
  scholar: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
  qk: '7k/8/6K1/8/8/8/8/1Q6 w - - 0 1',
  knightfork: '2q3k1/5ppp/8/3N4/8/8/5PPP/6K1 w - - 0 1',
  pin: '4k3/3q1ppp/8/8/P7/3B4/5PPP/6K1 w - - 0 1',
  skewer: '4q3/8/8/4k3/8/8/8/R5K1 w - - 0 1',
  discovered: '3qk3/8/8/4N3/8/8/8/4R1K1 w - - 0 1',
  pawnfork: '8/8/2n1k3/8/2PP4/8/8/4K3 w - - 0 1',
  queenfork: 'r3k3/8/8/8/8/8/8/3QK3 w - - 0 1',
  backrank2: '6k1/3r1ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
  blackbackrank: '3r2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1',
  blackfork: '6k1/5ppp/8/8/3n4/8/5PPP/2Q3K1 b - - 0 1',
  philidor: 'r6k/6pp/7N/8/8/1Q6/8/6K1 w - - 0 1',
  opera: fromGame('e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7'),
  reti: fromGame('e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nf6 Qd3 e5 dxe5 Qa5+ Bd2 Qxe5 O-O-O Nxe4'),
  legal: fromGame('e4 e5 Nf3 d6 Bc4 Bg4 Nc3 g6 Nxe5 Bxd1'),
}
writeFileSync('/tmp/pz.json', JSON.stringify(Object.entries(C).map(([id, fen]) => ({ id, fen, depth: 20 }))))
for (const [id, fen] of Object.entries(C)) console.log(id, fen)
