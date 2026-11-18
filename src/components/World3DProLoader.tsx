'use client'

import dynamic from 'next/dynamic'
import { useI18n } from '../lib/i18n'

function Loading3D() {
  const { t } = useI18n()
  return <>{t('lx.loading3d')}</>
}

const World3DPro = dynamic(() => import('./World3DPro'), {
  ssr: false,
  loading: () => (
    <div className="grid h-[62vh] min-h-[400px] w-full place-items-center rounded-2xl border border-line bg-surface text-muted">
      <Loading3D />
    </div>
  ),
})

export default function World3DProLoader() {
  return <World3DPro />
}
