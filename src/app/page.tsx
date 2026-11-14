import Link from 'next/link'
import ChessBoard from '../components/ChessBoard'
import { Badge, Icon, LinkButton } from '../components/ui'
import ContinueCard from '../components/ContinueCard'
import { CHAPTERS, ALL_LESSONS } from '../data/lessons'
import { TRAPS } from '../data/traps'
import { PUZZLES } from '../data/puzzles'
import { ARTICLES } from '../data/encyclopedia'
import { SITE } from '../lib/site'
import { BOTS } from '../data/bots'
import { COACH } from '../lib/coach'
import { RANKS } from '../lib/rank'

const SECTIONS = [
  { href: '/learn', icon: 'learn', title: 'الدروس', desc: `${ALL_LESSONS.length} درس تفاعلي من حركة العسكري لحد النهايات، بتلعب بإيدك في كل خطوة.` },
  { href: '/puzzles', icon: 'bulb', title: 'الألغاز', desc: `${PUZZLES.length} لغز: مات في نقلة، شوكات، تثبيت، ونهايات أدوار مشهورة.` },
  { href: '/traps', icon: 'trap', title: 'فخاخ الافتتاح', desc: `${TRAPS.length} فخ مشهور: إزاي تنصبه وإزاي ماتقعش فيه.` },
  { href: '/encyclopedia', icon: 'book', title: 'الموسوعة', desc: `${ARTICLES.length} مقال عن القواعد والافتتاحات والتكتيك والتاريخ، وقاموس مصطلحات.` },
  { href: '/play/computer', icon: 'cpu', title: 'ضد الكمبيوتر', desc: '8 مستويات من مبتدئ خالص لحد Stockfish بكل قوته، مع تلميحات.' },
  { href: '/daily', icon: 'star', title: 'لغز اليوم', desc: 'لغز جديد كل يوم، نفس اللغز لكل الناس. حافظ على سلسلة أيامك 🔥' },
  { href: '/play/friend', icon: 'users', title: 'مع صاحبك', desc: 'العبوا على نفس الجهاز، أو ابعت لينك والعبوا أونلاين.' },
]

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    inLanguage: 'ar',
    description: SITE.description,
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="arabesque relative -mx-4 grid items-center gap-8 overflow-hidden rounded-b-[2rem] bg-gradient-to-b from-[#0d2a1f]/70 to-transparent px-4 py-6 sm:mx-0 sm:rounded-[2rem] sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:py-12">
        <div className="animate-fade-up">
          <Badge>مجاني • من غير تسجيل • بالمصري</Badge>
          <h1 className="mt-4 font-display text-4xl leading-[1.25] font-bold sm:text-5xl">
            اتعلم <span className="text-gold-grad">الشطرنج</span>
            <br />
            زي ما حد قاعد جنبك وبيشرحلك
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            دروس قصيرة بتلعب فيها بإيدك، وألغاز متراجعة بالمحرك، وفخاخ الافتتاحات المشهورة، ولما تحس إنك جاهز العب ضد الكمبيوتر أو مع صاحبك.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton to="/learn">
              <Icon name="learn" /> ابدأ أول درس
            </LinkButton>
            <LinkButton to="/play/computer" variant="outline">
              <Icon name="cpu" /> العب دلوقتي
            </LinkButton>
          </div>
          <ContinueCard />
        </div>
        <div className="mx-auto w-full max-w-[460px]">
          <ChessBoard
            fen="r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4"
            movable={false}
            arrows={[{ from: 'c4', to: 'f7', color: 'gold' }]}
            highlights={['f7']}
          />
          <div className="animate-bubble mt-3 flex items-start gap-2 text-sm" style={{ animationDelay: '0.5s' }}>
            <span className="animate-float grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald/20 text-xl" aria-hidden>☕</span>
            <p className="rounded-2xl rounded-ss-sm border border-emerald/30 bg-surface/90 px-3 py-2">
              <strong className="me-1 text-emerald">{COACH.name}:</strong>
              ده «مات التلميذ». الوزير والفيل اتفقوا على الخانة f7، وهي أضعف خانة عند الأسود في الأول. هعلّمك تعمله، والأهم تعرف تمنعه.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="sections" className="mt-10">
        <h2 id="sections" className="mb-4 font-display text-2xl font-bold">هتلاقي إيه هنا؟</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="luxe-card group rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-gold/50">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-soft text-gold">
                <Icon name={s.icon} />
              </span>
              <h3 className="mt-3 text-lg font-bold group-hover:text-gold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="bots" className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="bots" className="font-display text-2xl font-bold">أهل الحتة مستنيينك على الترابيزة</h2>
          <Link href="/play/computer" className="text-sm font-bold text-gold hover:underline">اختار خصمك ←</Link>
        </div>
        <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
          {BOTS.map((b) => (
            <li key={b.id} className="w-56 shrink-0 snap-start sm:w-auto">
              <Link href="/play/computer" className="luxe-card group flex h-full flex-col rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-gold/50">
                <span className="flex items-center gap-2">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-b from-gold-2 to-gold text-sm font-bold text-[#1a1408] transition group-hover:scale-105" aria-hidden>{b.initials}</span>
                  <span>
                    <span className="block font-bold group-hover:text-gold">{b.name}</span>
                    <span className="text-xs text-muted">مستوى <bdi className="ltr">{b.level}</bdi></span>
                  </span>
                </span>
                <span className="mt-2 text-sm text-muted">«{b.greet}»</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ranks" className="arabesque relative mt-12 overflow-hidden rounded-3xl border border-gold/25 bg-surface p-5 sm:p-7">
        <h2 id="ranks" className="font-display text-2xl font-bold">اطلع من «{RANKS[0].name}» لـ«{RANKS[RANKS.length - 1].name}»</h2>
        <p className="mt-1 text-muted">كل درس ولغز ودور بيديك نقط. حافظ على سلسلة أيامك، واجمع الأوسمة، وشوف رتبتك بتطلع.</p>
        <ol className="mt-4 flex flex-wrap gap-2">
          {RANKS.map((r) => (
            <li key={r.name} className="flex items-center gap-1.5 rounded-full border border-line bg-bg/60 px-3 py-1.5 text-sm">
              <span className="text-lg leading-none text-gold" aria-hidden>{r.icon}</span> {r.name}
            </li>
          ))}
        </ol>
        <LinkButton to="/me" variant="outline" className="mt-5">
          <Icon name="star" /> شوف رتبتك
        </LinkButton>
      </section>

      <section aria-labelledby="path" className="mt-12">
        <h2 id="path" className="mb-4 font-display text-2xl font-bold">مسار التعلم</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHAPTERS.map((c, i) => (
            <li key={c.id}>
              <Link href={`/learn/${c.lessons[0].id}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 hover:border-gold/50">
                <span className="text-3xl text-gold" aria-hidden>{c.glyph}</span>
                <span>
                  <span className="block text-xs text-muted">الفصل {i + 1}</span>
                  <span className="font-bold">{c.title}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
