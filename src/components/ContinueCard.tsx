'use client'

import Link from 'next/link'
import { ALL_LESSONS } from '../data/lessons'
import { useAuth } from '../lib/auth'
import { useProgress } from '../lib/progress'

export default function ContinueCard() {
  const { lessons } = useProgress()
  const { status } = useAuth()
  if (status !== 'authed' || !lessons.length) return null
  const next = ALL_LESSONS.find((l) => !lessons.includes(l.id))
  return (
    <div className="mt-6 rounded-xl border border-gold/30 bg-gold-soft p-4 text-sm">
      <p>
        خلّصت <strong className="text-gold">{lessons.length}</strong> من {ALL_LESSONS.length} درس.
      </p>
      {next ? (
        <Link href={`/learn/${next.id}`} className="mt-1 inline-block font-bold text-gold underline-offset-4 hover:underline">
          كمّل: {next.title} ←
        </Link>
      ) : (
        <p className="mt-1 font-bold text-gold">خلّصت كل الدروس! جرّب الألغاز.</p>
      )}
    </div>
  )
}
