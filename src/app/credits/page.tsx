import type { Metadata } from 'next'
import { PageHeader } from '../../components/ui'

export const metadata: Metadata = {
  title: 'حقوق الصور',
  description: 'مصادر وتراخيص صور اللاعبين المشاهير المستخدمة في Chesti - كلها صور حرة الترخيص من Wikimedia Commons.',
  alternates: { canonical: '/credits' },
  robots: { index: false },
}

const PHOTOS: { player: string; author: string; license: string; file: string }[] = [
  { player: 'Emanuel Lasker', author: 'Trans-Ocean News Service', license: 'CC BY 3.0', file: 'https://commons.wikimedia.org/wiki/File:Emanuel_Lasker.jpg' },
  { player: 'José Raúl Capablanca', author: 'Keystone-France (مجهول)', license: 'ملكية عامة', file: 'https://commons.wikimedia.org/wiki/File:Jos%C3%A9_Ra%C3%BAl_Capablanca_1931.jpg' },
  { player: 'Mikhail Botvinnik', author: 'Harry Pot / Anefo', license: 'CC BY-SA 3.0 (هولندا)', file: 'https://commons.wikimedia.org/wiki/File:Mikhail_Botvinnik_1962.jpg' },
  { player: 'Judit Polgár', author: 'Przemysław Jahr', license: 'CC BY-SA 3.0', file: 'https://commons.wikimedia.org/wiki/File:Judit_Polg%C3%A1r_2013.jpg' },
  { player: 'Bobby Fischer', author: 'Bert Verhoeff / Anefo', license: 'CC0', file: 'https://commons.wikimedia.org/wiki/File:Bobby_Fischer_1972_(cropped).jpg' },
  { player: 'Garry Kasparov', author: 'Tore Sætre', license: 'CC BY-SA 4.0', file: 'https://commons.wikimedia.org/wiki/File:Garry_Kasparov_(103228)_(cropped)_2.jpg' },
  { player: 'Hikaru Nakamura', author: 'Andreas Kontokanis', license: 'CC BY-SA 2.0', file: 'https://commons.wikimedia.org/wiki/File:Hikaru_Nakamura_(2016)_crop.jpg' },
  { player: 'Magnus Carlsen', author: 'Andreas Kontokanis', license: 'CC BY-SA 2.0', file: 'https://commons.wikimedia.org/wiki/File:Magnus_Carlsen_2016_(cropped).jpg' },
]

export default function CreditsPage() {
  return (
    <>
      <PageHeader
        kicker="حقوق الصور"
        title="صور اللاعبين المشاهير"
        desc="صور الخصوم التمانية ضد الكمبيوتر كلها صور حرة الترخيص من Wikimedia Commons (ملكية عامة أو CC)، متحقق من ترخيص كل واحدة، ومستضافة محليًا على الموقع. الشكر كامل لأصحابها:"
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {PHOTOS.map((p) => (
          <li key={p.player} className="rounded-2xl border border-line bg-surface p-4">
            <p className="font-bold" dir="ltr">{p.player}</p>
            <p className="mt-1 text-sm text-muted">
              التصوير: <span dir="ltr">{p.author}</span>
              <br />
              الترخيص: <span dir="ltr">{p.license}</span>
            </p>
            <a href={p.file} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-bold text-gold hover:underline" dir="ltr">
              الملف الأصلي على Wikimedia Commons ↗
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted">
        بيانات الماتشات والماتشات القصيرة من <a href="https://database.lichess.org/elite/" target="_blank" rel="noopener noreferrer" className="font-bold text-gold hover:underline" dir="ltr">Lichess Elite Database ↗</a> (بيانات مفتوحة CC0). المحرك: <span dir="ltr">Stockfish</span>.
      </p>
    </>
  )
}
