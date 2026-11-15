// Computer opponents: famous chess players, one per engine level (src/lib/engine.ts LEVELS, by id).
// Avatars are initials only - no real photos.
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
    id: 'lasker',
    name: 'Emanuel Lasker',
    initials: 'La',
    tagline: 'بطل العالم الأطول حكمًا في التاريخ. فيلسوف اللعبة، بيكسبك بهدوء.',
    greet: 'الشطرنج مش حرب قطع، دي حرب أفكار. يلا نبدأ.',
    wins: 'اللي بيعرف يستنى، بيكسب في الآخر.',
    loses: 'خسارة كويسة بتعلّم أكتر من 10 مكاسب. أحسنت.',
    checked: 'كش؟ جميل، كده الدور بقى فيه فكرة.',
  },
  {
    level: 2,
    id: 'capablanca',
    name: 'Capablanca',
    initials: 'Ca',
    tagline: 'العبقري الكوبي. بيلعب بفطرة، وكأن القطع بتمشي لوحدها.',
    greet: 'الشطرنج سهلة: حط كل قطعة في مكانها الصح، وبس.',
    wins: 'البساطة دايمًا بتكسب يا صديقي.',
    loses: 'جميل! قليل أوي اللي بيكسبني في دور نضيف كده.',
    checked: 'كش واحد مش هيغير النتيجة يا صديقي.',
  },
  {
    level: 3,
    id: 'botvinnik',
    name: 'Botvinnik',
    initials: 'Bo',
    tagline: 'أبو المدرسة السوفيتية. كل نقلة عنده ليها سبب علمي محسوب.',
    greet: 'حللت نقاط ضعفك قبل الدور. اتفضل ابدأ.',
    wins: 'كما توقع التحليل تمامًا.',
    loses: 'هسجل الدور ده وأدرسه النهاردة بالليل. مبروك.',
    checked: 'ملحوظ. سيتم أخذ الكش في الاعتبار.',
  },
  {
    level: 4,
    id: 'polgar',
    name: 'Judit Polgar',
    initials: 'Po',
    tagline: 'أقوى لاعبة في التاريخ. بتهجم من أول نقلة ومبترحمش حد.',
    greet: 'أنا جيت أهاجم. دافع كويس لو تقدر.',
    wins: 'الهجوم أفضل دفاع، ومحدش بيقدر عليه.',
    loses: 'حلو! قليل اللي بيصمد قدامي كده. عاشت.',
    checked: 'كشك ده مش هيوقف الهجوم.',
  },
  {
    level: 5,
    id: 'fischer',
    name: 'Bobby Fischer',
    initials: 'Fi',
    tagline: 'عبقري أمريكا. دقة مرعبة، ومبيسيبش أصغر غلطة تعدي.',
    greet: 'أنا بلعب عشان أكسب، مش عشان نتسلى.',
    wins: 'الشطرنج محتاجة تركيز. إنت رحت فين بالضبط؟',
    loses: 'مش مصدق. هنحلل الدور ده دلوقتي حالًا.',
    checked: 'الكش مش نقلة، الكش مجرد إزعاج.',
  },
  {
    level: 6,
    id: 'kasparov',
    name: 'Kasparov',
    initials: 'Ka',
    tagline: 'أسطورة روسيا. طاقة نار وهجوم مش بيقف من أول نقلة.',
    greet: 'أنا كسبت كل حد قابلته في جيلي. استعد.',
    wins: 'الهجوم عندي مش اختيار، ده طبيعتي.',
    loses: 'برافو، دور محترم. بس متتعودش: الجاية ليا.',
    checked: 'كشك بيضحكني. شوف اللي جاي.',
  },
  {
    level: 7,
    id: 'nakamura',
    name: 'Hikaru',
    initials: 'Hi',
    tagline: 'ملك البليتز والسرعة. بيلعب أسرع من ما تفكر.',
    greet: 'يلا بسرعة، الدور ده مش هياخد منك وقت طويل… للأسف.',
    wins: 'جي جي. السرعة فرقت.',
    loses: 'أوكي، دي كانت محترمة. ريفينج؟',
    checked: 'كش؟ شفتها من 3 نقلات.',
  },
  {
    level: 8,
    id: 'carlsen',
    name: 'Magnus Carlsen',
    initials: 'Ma',
    tagline: 'أعلى تقييم في تاريخ اللعبة. النهايات عنده فن لوحده.',
    greet: 'العب أحسن اللي عندك. أنا قعدت قدام أعظم لاعبين العالم.',
    wins: 'الدور اتكسب من النص، إنت بس اللي مكمل.',
    loses: 'ماشي… دي هتتكتب في الكتب. مبروك بجد.',
    checked: 'كش. ومن هنا أنا اللي هكسب.',
  },
]

export const botForLevel = (level: number) => BOTS.find((b) => b.level === level) ?? BOTS[0]
