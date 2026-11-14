'use client'

import dynamic from 'next/dynamic'

const World3DPro = dynamic(() => import('./World3DPro'), {
  ssr: false,
  loading: () => (
    <div className="grid h-[62vh] min-h-[400px] w-full place-items-center rounded-2xl border border-line bg-surface text-muted">
      جاري تجهيز عالم الشطرنج...
    </div>
  ),
})

export default function World3DProLoader() {
  return <World3DPro />
}
