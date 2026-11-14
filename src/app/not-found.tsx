import Link from 'next/link'
import { LinkButton } from '../components/ui'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-7xl leading-none text-gold" aria-hidden>♞</p>
      <h1 className="mt-4 text-2xl font-bold">الصفحة دي مش موجودة</h1>
      <p className="mt-2 text-muted">شكل الحصان نطّ في حتة غلط. ارجع للرئيسية وكمّل من هناك.</p>
      <div className="mt-6 flex justify-center gap-2">
        <LinkButton to="/">الرئيسية</LinkButton>
        <Link href="/learn" className="inline-flex items-center rounded-xl px-5 py-3 text-sm font-bold text-muted hover:text-ink">الدروس</Link>
      </div>
    </div>
  )
}
