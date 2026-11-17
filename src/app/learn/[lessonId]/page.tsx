import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LessonPlayer from '../../../components/LessonPlayer'
import LessonHeader from '../../../components/LessonHeader'
import LessonCrumb from '../../../components/LessonCrumb'
import LessonPager from '../../../components/LessonPager'
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
      <LessonCrumb chapterTitle={lesson.chapter.title} chapterId={lesson.chapter.id} />
      <LessonHeader id={lesson.id} title={lesson.title} summary={lesson.summary} />
      <LessonPlayer lessonId={lesson.id} nextId={next?.id} nextTitle={next?.title} />
      <noscript>
        <ol className="mt-6 list-decimal space-y-2 ps-6">
          {lesson.steps.map((s, i) => (
            <li key={i}>{plain(s.text)}</li>
          ))}
        </ol>
      </noscript>
      <LessonPager prev={prev && { id: prev.id, title: prev.title }} next={next && { id: next.id, title: next.title }} />
    </article>
  )
}
