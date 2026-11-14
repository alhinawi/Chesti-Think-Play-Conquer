// Computer opponents. Each one plays at one engine level (src/lib/engine.ts LEVELS, by id).
export interface Bot {
  level: number
  id: string
  name: string
  /** two letters for the avatar */
  initials: string
  tagline: string
  greet: string
  /** the bot won */
  wins: string
  /** the user won */
  loses: string
  /** the user gave check */
  checked: string
}

export const BOTS: Bot[] = [
  {
    level: 1,
    id: 'am-sayed',
    name: 'عم سيد البواب',
    initials: 'سي',
    tagline: 'لسه بيتعلم القطع بتمشي إزاي. بيحرك أي حاجة وخلاص.',
    greet: 'أهلا يا باشا! أنا لسه سايب العمارة وجاي، ارحمني شوية.',
    wins: 'يا نهار أبيض! كسبت؟ أنا نفسي مش مصدق.',
    loses: 'برافو عليك، بس ماتقولش لحد في العمارة.',
    checked: 'إيه ده؟ كش؟ طيب استنى أشوف الملك فين.',
  },
  {
    level: 2,
    id: 'om-karim',
    name: 'أم كريم',
    initials: 'أك',
    tagline: 'بتلعب وهي بتطبخ، فبتسيب قطع كتير من غير حماية.',
    greet: 'يلا بسرعة قبل ما المحشي يستوي.',
    wins: 'شفت؟ وأنا بلف محشي كمان.',
    loses: 'ماشي يا سيدي، المحشي اتحرق بسببك.',
    checked: 'استنى استنى، كش إيه بس وأنا ماسكة المعلقة!',
  },
  {
    level: 3,
    id: 'mido',
    name: 'ميدو ابن الجيران',
    initials: 'مي',
    tagline: 'بيشوف التهديدات القريبة، وبيحب يهجم بدري.',
    greet: 'هاكلك في 10 نقلات، الرهان على كانز بيبسي.',
    wins: 'هات الكانز يا كبير.',
    loses: 'ماشي، بس أنا كنت سايبك تكسب بمزاجي.',
    checked: 'هو إنت بتلعب بجد ولا إيه؟',
  },
  {
    level: 4,
    id: 'shawky',
    name: 'الأستاذ شوقي',
    initials: 'شو',
    tagline: 'مدرس رياضيات، بيلعب منظم زي لاعب نادي كويس.',
    greet: 'الشطرنج زي المعادلات، كل خطوة لازم تبقى محسوبة.',
    wins: 'النتيجة صح بس الخطوات غلط. راجع الدرس وتعالى.',
    loses: 'عشرة من عشرة، ونجمة كمان.',
    checked: 'حلوة. بس خلي بالك من الخطوة الجاية.',
  },
  {
    level: 5,
    id: 'captain-adel',
    name: 'كابتن عادل',
    initials: 'عا',
    tagline: 'مدرب في مركز الشباب. هيعاقبك على أي غلطة.',
    greet: 'إحماء الأول، وبعدين نشوف نفسك طويل ولا لأ.',
    wins: 'التمرين بكرة الساعة سبعة الصبح، ماتتأخرش.',
    loses: 'جامد! كده أقدر أحطك في التشكيلة.',
    checked: 'كويس، بس الكش مش هدف في نفسه.',
  },
  {
    level: 6,
    id: 'metwally',
    name: 'الحاج متولي',
    initials: 'مت',
    tagline: 'صاحب القهوة. بيلعب من 40 سنة ومحدش بيكسبه.',
    greet: 'اتفضل اقعد. الشاي عليّا، والخسارة عليك.',
    wins: 'القهوة ليها كبير يا ابني.',
    loses: 'من أربعين سنة محدش عملها! الشاي بتاعك مجانًا طول الشهر.',
    checked: 'الله! الواد ده فيه ريحة من زمان.',
  },
  {
    level: 7,
    id: 'zaki',
    name: 'المعلّم زكي',
    initials: 'زك',
    tagline: 'اللي بيراهنوا عليه في دورة الحتة. قوي جدًا.',
    greet: 'أنا مابلعبش للتسلية.',
    wins: 'اللي بعده.',
    loses: 'المعلّم بيسلّملك. ماحدش عملها قبلك من زمان.',
    checked: 'مش بطالة.',
  },
  {
    level: 8,
    id: 'el-wahsh',
    name: 'الوحش',
    initials: 'وح',
    tagline: 'Stockfish بكل قوته. أقوى من أي بني آدم.',
    greet: '…',
    wins: 'كان متوقع.',
    loses: 'مستحيل… إنت مين؟',
    checked: 'محسوبة.',
  },
]

export const botForLevel = (level: number) => BOTS.find((b) => b.level === level) ?? BOTS[0]
