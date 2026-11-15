import type { Metadata } from 'next'
import { LinkButton, PageHeader } from '../../components/ui'
import OpeningsList from '../../components/OpeningsList'
import { OPENINGS } from '../../data/openings'

export const metadata: Metadata = {
  title: 'مكتبة الافتتاحيات',
  description: `${OPENINGS.length} افتتاحية شطرنج مشروحة بالمصري: الخط الرئيسي نقلة بنقلة، وخطة الأبيض وخطة الأسود في كل واحدة.`,
  alternates: { canonical: '/openings' },
}

export default function OpeningsPage() {
  return (
    <>
      <PageHeader
        kicker="مكتبة الافتتاحيات"
        title="اختار افتتاحيتك"
        desc="مش لازم تحفظ خطوط كتير: افهم الفكرة والخطة، وجرّبها في أدوارك. كل افتتاحية مشروحة نقلة بنقلة وبخطط الجانبين."
      >
        <LinkButton to="/openings/explorer" variant="soft">
          مستكشف كل الافتتاحيات (3,865 خط ECO)
        </LinkButton>
      </PageHeader>
      <OpeningsList />
    </>
  )
}
