export const SITE = {
  name: 'شَطرنجي',
  short: 'شطرنجي',
  tagline: 'اتعلم الشطرنج بالمصري من الصفر',
  description:
    'شطرنجي: دروس شطرنج تفاعلية باللهجة المصرية، وفخاخ الافتتاحات، وألغاز، وموسوعة، والعب ضد الكمبيوتر أو مع صاحبك. مجاني ومن غير تسجيل.',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://chesti.vercel.app').replace(/\/$/, ''),
}

export const NAV = [
  { href: '/', label: 'الرئيسية', icon: 'home' },
  { href: '/learn', label: 'الدروس', icon: 'learn' },
  { href: '/puzzles', label: 'ألغاز', icon: 'bulb' },
  { href: '/traps', label: 'الفخاخ', icon: 'trap' },
  { href: '/encyclopedia', label: 'الموسوعة', icon: 'book' },
  { href: '/play', label: 'العب', icon: 'play' },
] as const
