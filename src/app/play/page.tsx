import type { Metadata } from 'next'
import Link from 'next/link'
import { Icon, PageHeader } from '../../components/ui'

export const metadata: Metadata = {
  title: 'العب شطرنج أونلاين مجانًا',
  description: 'العب شطرنج ضد الكمبيوتر بـ 8 مستويات من المبتدئ لستوكفيش بكل قوته، أو العب مع صاحبك على نفس الجهاز أو أونلاين بلينك. مجانًا ومن غير تسجيل.',
  alternates: { canonical: '/play' },
}

const MODES = [
  { to: '/play/computer', icon: 'cpu', title: 'ضد الكمبيوتر', desc: '8 مستويات، من المبتدئ الخالص لحد ستوكفيش بكل قوته. فيه تلميح ورجوع لو احتجت.' },
  { to: '/play/friend', icon: 'users', title: 'مع صاحبك', desc: 'على نفس الموبايل وانتو قاعدين مع بعض، أو ابعتله لينك والعبوا أونلاين.' },
]

export default function PlayPage() {
  return (
    <>
      <PageHeader kicker="العب" title="يلا نلعب" desc="اختار هتلعب مع مين." />
      <ul className="grid gap-4 sm:grid-cols-2">
        {MODES.map((m) => (
          <li key={m.to}>
            <Link href={m.to} className="luxe-card group flex h-full items-start gap-4 rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-gold/50">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gold-soft text-gold">
                <Icon name={m.icon} className="h-7 w-7" />
              </span>
              <span>
                <span className="block text-lg font-bold group-hover:text-gold">{m.title}</span>
                <span className="mt-1 block text-sm text-muted">{m.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
