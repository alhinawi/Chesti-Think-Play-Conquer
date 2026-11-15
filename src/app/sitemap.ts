import type { MetadataRoute } from 'next'
import { ARTICLES } from '../data/encyclopedia'
import { ALL_LESSONS as LESSONS } from '../data/lessons'
import { PUZZLES } from '../data/puzzles'
import { TRAPS } from '../data/traps'
import { MINIATURES } from '../data/miniatures'
import { OPENINGS } from '../data/openings'
import { GAMES } from '../data/games'
import { ENDGAMES } from '../data/endgames'
import { SITE } from '../lib/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string, priority = 0.6): MetadataRoute.Sitemap[number] => ({ url: `${SITE.url}${p === '/' ? '/' : `${p}/`}`, changeFrequency: 'monthly', priority })
  return [
    u('/', 1),
    u('/learn', 0.9),
    u('/puzzles', 0.8),
    u('/traps', 0.9),
    u('/miniatures', 0.85),
    u('/openings', 0.9),
    u('/openings/explorer', 0.8),
    u('/games', 0.8),
    u('/matches', 0.9),
    u('/squares', 0.7),
    u('/rush', 0.7),
    u('/endgames', 0.8),
    u('/encyclopedia', 0.9),
    u('/glossary', 0.7),
    u('/credits', 0.3),
    u('/daily', 0.8),
    u('/world3d', 0.8),
    u('/play', 0.8),
    u('/play/computer', 0.8),
    u('/play/friend', 0.7),
    ...LESSONS.map((l) => u(`/learn/${l.id}`, 0.8)),
    ...TRAPS.map((t) => u(`/traps/${t.id}`, 0.8)),
    ...MINIATURES.map((t) => u(`/miniatures/${t.id}`, 0.8)),
    ...OPENINGS.map((o) => u(`/openings/${o.id}`, 0.8)),
    ...GAMES.map((g) => u(`/games/${g.id}`, 0.7)),
    ...ENDGAMES.map((e) => u(`/endgames/${e.id}`, 0.7)),
    ...ARTICLES.map((a) => u(`/encyclopedia/${a.id}`, 0.7)),
    ...PUZZLES.map((p) => u(`/puzzles/${p.id}`, 0.4)),
  ]
}
