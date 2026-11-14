import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import LessonPlayer from '../../../components/LessonPlayer'
import { ALL_LESSONS } from '../../../data/lessons'
import { SITE } from '../../../lib/site'

export const dynamicParams = false

export function generateStaticParams() {
  return ALL_LESSONS.map((l) => ({ lessonId: l.id }))
}

type Props = { params: Promise<{ lessonId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonId } = await params
  const l = ALL_LESSONS.find((x) => x.id === lessonId)
  if (!l) return {}
  return {
    title: `${l.title} — درس شطرنج`,
    description: `${l.summary} درس تفاعلي من فصل "${l.chapter.title}" بالمصري.`,
    alternates: { canonical: `/learn/${l.id}` },
    openGraph: { title: l.title, description: l.summary, url: `/learn/${l.id}` },
  }
}

/** Plain text of a step, for the static HTML that search engines read. */
const plain = (s: string) => s.replace(/[*`_]/g, '')

export default async function LessonPage({ params }: Props) {
  const { lessonId } = await params
  const idx = ALL_LESSONS.findIndex((l) => l.id === lessonId)
  if (idx < 0) notFound()
  const lesson = ALL_LESSONS[idx]
  const prev = ALL_LESSONS[idx - 1]
  const next = ALL_LESSONS[idx + 1]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: lesson.title,
    description: lesson.summary,
    inLanguage: 'ar',
    learningResourceType: 'Interactive lesson',
    isPartOf: { '@type': 'Course', name: `${SITE.name}: ${lesson.chapter.title}` },
    url: `${SITE.url}/learn/${lesson.id}`,
  }
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="مسار الصفحة" className="mb-3 text-sm text-muted">
        <Link href="/learn" className="hover:text-gold">الدروس</Link>
        <span className="mx-2">/</span>
        <span>{lesson.chapter.title}</span>
      </nav>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{lesson.title}</h1>
      <p className="mt-1 mb-5 text-muted">{lesson.summary}</p>
      <LessonPlayer lessonId={lesson.id} nextId={next?.id} nextTitle={next?.title} />
      <noscript>
        <ol className="mt-6 list-decimal space-y-2 ps-6">
          {lesson.steps.map((s, i) => (
            <li key={i}>{plain(s.text)}</li>
          ))}
        </ol>
      </noscript>
      <nav aria-label="دروس تانية" className="mt-10 flex flex-wrap justify-between gap-3 border-t border-line pt-5 text-sm">
        {prev ? <Link href={`/learn/${prev.id}`} className="text-muted hover:text-gold">→ {prev.title}</Link> : <span />}
        {next ? <Link href={`/learn/${next.id}`} className="text-muted hover:text-gold">{next.title} ←</Link> : <Link href="/puzzles" className="text-muted hover:text-gold">الألغاز ←</Link>}
      </nav>
    </article>
  )
}
