// Computer opponents: famous chess players, one per engine level (src/lib/engine.ts LEVELS, by id).
// Avatars are initials only - no real photos.
export interface Bot {
  level: number
  id: string
  name: string
  /** two letters for the avatar (fallback when no photo) */
  initials: string
  /** locally hosted, freely licensed portrait (see /credits) */
  photo?: string
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
    photo: '/bots/lasker.jpg',
    name: 'Emanuel Lasker',
    initials: 'La',
    tagline: 'بطل العالم الأطول حكمًا في التاريخ. فيلسوف اللعبة، بيكسبك بهدوء.',
    greet: 'قعدت على العرش 27 سنة. خد وقتك وابدأ، أنا مفيش حاجة بتعصبني.',
    wins: 'قلتلك. الشطرنج نفسية قبل ما تكون قطع.',
    loses: 'عاشت والله. محدش كسبني بالساهل، وإنت عملتها.',
    checked: 'كش؟ النفس هادية يا صاحبي، الهجوم مش بالصوت.',
  },
  {
    level: 2,
    id: 'capablanca',
    photo: '/bots/capablanca.jpg',
    name: 'Capablanca',
    initials: 'Ca',
    tagline: 'العبقري الكوبي. بيلعب بفطرة، وكأن القطع بتمشي لوحدها.',
    greet: 'أنا مش بحتاج أفكر أصلًا، القطع بتلعب لوحدها. اتفرج وتعلّم.',
    wins: 'سهلة؟ آه. إنت اللي صعّبتها على نفسك.',
    loses: 'دي خسارة نادرة، احتفظ بيها. قليل أوي اللي يقدر يعملها.',
    checked: 'كش حلو. وبرضه هكسبك.',
  },
  {
    level: 3,
    id: 'botvinnik',
    photo: '/bots/botvinnik.jpg',
    name: 'Botvinnik',
    initials: 'Bo',
    tagline: 'أبو المدرسة السوفيتية. كل نقلة عنده ليها سبب علمي محسوب.',
    greet: 'محللك من دلوقتي، وعارف نقطة ضعفك فين. جرّب تخبيها.',
    wins: 'التحليل مبيكذبش. الجاية اذاكر أكتر.',
    loses: 'الدور ده هيدخل المنهج. مبروك، بقيت جزء من العلم.',
    checked: 'كش متوقع. والرد مدروس.',
  },
  {
    level: 4,
    id: 'polgar',
    photo: '/bots/polgar.jpg',
    name: 'Judit Polgar',
    initials: 'Po',
    tagline: 'أقوى لاعبة في التاريخ. بتهجم من أول نقلة ومبترحمش حد.',
    greet: 'أنا بهاجم من أول نقلة. لو ناوي تدافع وبس، اقفل التاب أحسن.',
    wins: 'قلتلك مبرحمش. الهجوم مش جريمة.',
    loses: 'صمدت قدام هجومي؟ دي وسام على صدرك.',
    checked: 'كشك ده بيزوّد ناري بس.',
  },
  {
    level: 5,
    id: 'fischer',
    photo: '/bots/fischer.jpg',
    name: 'Bobby Fischer',
    initials: 'Fi',
    tagline: 'عبقري أمريكا. دقة مرعبة، ومبيسيبش أصغر غلطة تعدي.',
    greet: 'غلطة واحدة منك وأنا جاييك. جاهز؟',
    wins: 'غلطت. وقلتلك أنا مبسامحش.',
    loses: 'إزاي؟! لأ، استنى… بجد محترم. الدور ده يتدرّس.',
    checked: 'كش؟ إزعاج بس. ركّز في المشكلة الحقيقية.',
  },
  {
    level: 6,
    id: 'kasparov',
    photo: '/bots/kasparov.jpg',
    name: 'Kasparov',
    initials: 'Ka',
    tagline: 'أسطورة روسيا. طاقة نار وهجوم مش بيقف من أول نقلة.',
    greet: 'كل جيلي عدى من هنا ووقع. جهز نفسك، دورك إنت.',
    wins: 'النار اللي جوايا مش بتنطفي. حاول تبردها الجاية.',
    loses: 'سجّل التاريخ ده: كسبت كاسباروف. بس الجاية ليا، متتعودش.',
    checked: 'كش؟ هاها. شوف بقى النار الحقيقية.',
  },
  {
    level: 7,
    id: 'nakamura',
    photo: '/bots/nakamura.jpg',
    name: 'Hikaru',
    initials: 'Hi',
    tagline: 'ملك البليتز والسرعة. بيلعب أسرع من ما تفكر.',
    greet: 'عندك 3 سواني تفكر فيهم. أوه، خلاص عدّوا.',
    wins: 'جي جي. وأنا أصلًا مكنتش باصص للشاشة.',
    loses: 'إيه ده… كسبتني؟ ريفينج. دلوقتي. حالًا.',
    checked: 'الكش ده شفته قبل ما تفكر فيه.',
  },
  {
    level: 8,
    id: 'carlsen',
    photo: '/bots/carlsen.jpg',
    name: 'Magnus Carlsen',
    initials: 'Ma',
    tagline: 'أعلى تقييم في تاريخ اللعبة. النهايات عنده فن لوحده.',
    greet: 'هات آخرك. أنا قعدت أعظم لاعبين التاريخ، وجيتلك إنت.',
    wins: 'النهايات دي أنا اللي كاتبها. إنت كنت ضيف فيها بس.',
    loses: 'خسرت؟ سيبني أتأكد… آه بجد. احتفل كويس، دي مش بتتكرر.',
    checked: 'كش واحد؟ استنى تشوف الباقي.',
  },
]

export const botForLevel = (level: number) => BOTS.find((b) => b.level === level) ?? BOTS[0]
