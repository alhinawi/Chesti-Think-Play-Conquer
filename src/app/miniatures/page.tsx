import type { Metadata } from 'next'
import { MiniaturesHeader } from '../../components/ListHeaders'
import MiniaturesList from '../../components/MiniaturesList'
import { MINIATURES } from '../../data/miniatures'

export const metadata: Metadata = {
  title: 'ماتشات خاطفة - مات في 15 نقلة أو أقل',
  description: `${MINIATURES.length} ماتش حقيقي قصير بين لاعبين 2500+ انتهى بكش مات على الرقعة: الغلطة القاتلة متعلم عليها ومتحقق منها بالمحرك، والشرح بالمصري نقلة بنقلة.`,
  alternates: { canonical: '/miniatures' },
}

export default function MiniaturesPage() {
  return (
    <>
      <MiniaturesHeader />
      <MiniaturesList />
    </>
  )
}
