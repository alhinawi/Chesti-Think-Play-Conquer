'use client'

import { PageHeader } from './ui'
import { useI18n } from '../lib/i18n'

const PHOTOS: { player: string; author: string; license: string; file: string }[] = [
  { player: 'Emanuel Lasker', author: 'Trans-Ocean News Service', license: 'CC BY 3.0', file: 'https://commons.wikimedia.org/wiki/File:Emanuel_Lasker.jpg' },
  { player: 'José Raúl Capablanca', author: 'Keystone-France (unknown)', license: 'Public domain', file: 'https://commons.wikimedia.org/wiki/File:Jos%C3%A9_Ra%C3%BAl_Capablanca_1931.jpg' },
  { player: 'Mikhail Botvinnik', author: 'Harry Pot / Anefo', license: 'CC BY-SA 3.0 (Netherlands)', file: 'https://commons.wikimedia.org/wiki/File:Mikhail_Botvinnik_1962.jpg' },
  { player: 'Judit Polgár', author: 'Przemysław Jahr', license: 'CC BY-SA 3.0', file: 'https://commons.wikimedia.org/wiki/File:Judit_Polg%C3%A1r_2013.jpg' },
  { player: 'Bobby Fischer', author: 'Bert Verhoeff / Anefo', license: 'CC0', file: 'https://commons.wikimedia.org/wiki/File:Bobby_Fischer_1972_(cropped).jpg' },
  { player: 'Garry Kasparov', author: 'Tore Sætre', license: 'CC BY-SA 4.0', file: 'https://commons.wikimedia.org/wiki/File:Garry_Kasparov_(103228)_(cropped)_2.jpg' },
  { player: 'Hikaru Nakamura', author: 'Andreas Kontokanis', license: 'CC BY-SA 2.0', file: 'https://commons.wikimedia.org/wiki/File:Hikaru_Nakamura_(2016)_crop.jpg' },
  { player: 'Magnus Carlsen', author: 'Andreas Kontokanis', license: 'CC BY-SA 2.0', file: 'https://commons.wikimedia.org/wiki/File:Magnus_Carlsen_2016_(cropped).jpg' },
]

export default function CreditsBody() {
  const en = useI18n().locale === 'en'
  return (
    <>
      <PageHeader
        kicker={en ? 'Photo credits' : 'حقوق الصور'}
        title={en ? 'Photos of famous players' : 'صور اللاعبين المشاهير'}
        desc={en ? 'The photos of the eight computer opponents are all freely licensed images from Wikimedia Commons (public domain or CC). Each license was checked, and the files are hosted locally on the site. Full thanks to their authors:' : 'صور الخصوم التمانية ضد الكمبيوتر كلها صور حرة الترخيص من Wikimedia Commons (ملكية عامة أو CC)، متحقق من ترخيص كل واحدة، ومستضافة محليًا على الموقع. الشكر كامل لأصحابها:'}
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {PHOTOS.map((p) => (
          <li key={p.player} className="rounded-2xl border border-line bg-surface p-4">
            <p className="font-bold" dir="ltr">{p.player}</p>
            <p className="mt-1 text-sm text-muted">
              {en ? 'Photo' : 'التصوير'}: <span dir="ltr">{(en ? p.author : p.author.replace('(unknown)','(مجهول)'))}</span>
              <br />
              {en ? 'License' : 'الترخيص'}: <span dir="ltr">{(en ? p.license : p.license.replace('Public domain','ملكية عامة').replace('(Netherlands)','(هولندا)'))}</span>
            </p>
            <a href={p.file} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-bold text-gold hover:underline" dir="ltr">
              {en ? 'Original file on Wikimedia Commons ↗' : 'الملف الأصلي على Wikimedia Commons ↗'}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted">
        {en ? 'Game and miniature data from ' : 'بيانات الماتشات والماتشات القصيرة من '}<a href="https://database.lichess.org/elite/" target="_blank" rel="noopener noreferrer" className="font-bold text-gold hover:underline" dir="ltr">Lichess Elite Database ↗</a> {en ? '(open data, CC0). Engine:' : '(بيانات مفتوحة CC0). المحرك:'} <span dir="ltr">Stockfish</span>.
      </p>
    </>
  )
}
