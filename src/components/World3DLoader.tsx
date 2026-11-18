'use client'

import dynamic from 'next/dynamic'
import { useI18n } from '../lib/i18n'

function Loading3D() {
  const { t } = useI18n()
  return <>{t('lx.loading3d')}</>
}

const World3D = dynamic(() => import('./World3D'), {
  ssr: false,
  loading: () => (
    <div className="grid h-[60vh] min-h-[380px] w-full place-items-center rounded-2xl border border-line bg-gradient-to-b from-[#0d1420] to-[#090d15] text-muted">
      <Loading3D />
    </div>
  ),
})

export default function World3DLoader() {
  return <World3D />
}
