export const SITE = {
  name: 'Chesti',
  short: 'Chesti',
  tagline: 'اتعلم الشطرنج بالمصري من الصفر',
  description:
    'Chesti: دروس شطرنج تفاعلية باللهجة المصرية، ومكتبة افتتاحيات، وفخاخ الافتتاحات، وألغاز، وموسوعة، والعب ضد الكمبيوتر أو مع صاحبك، وترابيزات بلياردو وبينج.',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://chesti.pages.dev').replace(/\/$/, ''),
}

export const NAV = [
  { href: '/', label: 'الرئيسية', icon: 'home' },
  { href: '/learn', label: 'الدروس', icon: 'learn' },
  { href: '/puzzles', label: 'ألغاز', icon: 'bulb' },
  { href: '/traps', label: 'الفخاخ', icon: 'trap' },
  { href: '/openings', label: 'افتتاحيات', icon: 'compass' },
  { href: '/matches', label: 'ماتشات', icon: 'star' },
  { href: '/encyclopedia', label: 'الموسوعة', icon: 'book' },
  { href: '/world3d', label: 'عالم 3D', icon: 'globe' },
  { href: '/play', label: 'العب', icon: 'play' },
] as const
