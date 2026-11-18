'use client'

import { PageHeader } from './ui'
import { useI18n } from '../lib/i18n'

export default function SquaresHeader() {
  const en = useI18n().locale === 'en'
  return en ? (
    <PageHeader
      kicker="Square drill"
      title="Eyes on the board"
      desc="A pro does not think how to get to a square, the eye goes there by itself. This drill builds that memory: 30 seconds, one point per correct square."
    />
  ) : (
    <PageHeader
      kicker="تمرين الخانات"
      title="عينك على الرقعة"
      desc="المحترف مش بيفكر إزاي يوصل للخانة، عينه بتروح لها لوحدها. التمرين ده بيبني الذاكرة دي: 30 ثانية وكل خانة صح بنقطة."
    />
  )
}
