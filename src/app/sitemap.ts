import type { MetadataRoute } from 'next'
import { ARTICLES } from '../data/encyclopedia'
import { ALL_LESSONS as LESSONS } from '../data/lessons'
import { PUZZLES } from '../data/puzzles'
import { TRAPS } from '../data/traps'
import { OPENINGS } from '../data/openings'
import { SITE } from '../lib/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string, priority = 0.6): MetadataRoute.Sitemap[number] => ({ url: `${SITE.url}${p === '/' ? '/' : `${p}/`}`, changeFrequency: 'monthly', priority })
  return [
    u('/', 1),
    u('/learn', 0.9),
    u('/puzzles', 0.8),
    u('/traps', 0.9),
    u('/openings', 0.9),
    u('/encyclopedia', 0.9),
    u('/glossary', 0.7),
    u('/daily', 0.8),
    u('/play', 0.8),
    u('/play/computer', 0.8),
    u('/play/friend', 0.7),
    ...LESSONS.map((l) => u(`/learn/${l.id}`, 0.8)),
    ...TRAPS.map((t) => u(`/traps/${t.id}`, 0.8)),
    ...OPENINGS.map((o) => u(`/openings/${o.id}`, 0.8)),
    ...ARTICLES.map((a) => u(`/encyclopedia/${a.id}`, 0.7)),
    ...PUZZLES.map((p) => u(`/puzzles/${p.id}`, 0.4)),
  ]
}
