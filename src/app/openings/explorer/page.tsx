import type { Metadata } from 'next'
import Explorer from '../../../components/OpeningsExplorer'

export const metadata: Metadata = {
  title: 'مستكشف كل الافتتاحيات',
  description:
    'كل افتتاحيات الشطرنج الرسمية (ECO كامل): 3,865 خط افتتاحي بالاسم والكود، قابل لإعادة التشغيل نقلة بنقلة على الرقعة.',
  alternates: { canonical: '/openings/explorer' },
}

export default function OpeningsExplorerPage() {
  return <Explorer />
}
