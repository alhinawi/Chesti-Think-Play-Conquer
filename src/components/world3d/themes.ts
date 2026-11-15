// ثيمات عالم شطرنج 3D: خامات الرقعة والأرضية والإضاءة لكل مزاج.
export interface World3DTheme {
  id: string
  name: string
  /** لونا مربعات الرقعة */
  squareLight: number
  squareDark: number
  squareRoughness: number
  /** قاعدة الرقعة والإطار */
  base: number
  frame: number
  frameMetalness: number
  /** الأرضية المحيطة */
  floor: number
  floorRoughness: number
  /** خلفية المشهد */
  skyTop: string
  skyBottom: string
  fog: number
  /** الإضاءة */
  ambient: number
  keyColor: number
  keyIntensity: number
  rimColor: number
  rimIntensity: number
  /** صبغة القطع (أبيض/أسود) - اختياري */
  pieceWhite?: number
  pieceBlack?: number
}

export const WORLD3D_THEMES: World3DTheme[] = [
  {
    id: 'wood',
    name: 'خشب كلاسيك',
    squareLight: 0xe8d0a9,
    squareDark: 0x7a4a2b,
    squareRoughness: 0.5,
    base: 0x3a2415,
    frame: 0x9c6b3f,
    frameMetalness: 0.1,
    floor: 0x2a1c11,
    floorRoughness: 0.85,
    skyTop: '#1a120b',
    skyBottom: '#0d0805',
    fog: 0x0d0805,
    ambient: 0.55,
    keyColor: 0xffd9a0,
    keyIntensity: 1.5,
    rimColor: 0xffb36b,
    rimIntensity: 0.35,
  },
  {
    id: 'marble',
    name: 'رخام فاخر',
    squareLight: 0xf2f0ec,
    squareDark: 0x2e3138,
    squareRoughness: 0.18,
    base: 0x1c1e24,
    frame: 0xd9a94a,
    frameMetalness: 0.8,
    floor: 0x14161c,
    floorRoughness: 0.3,
    skyTop: '#10131a',
    skyBottom: '#08090d',
    fog: 0x08090d,
    ambient: 0.6,
    keyColor: 0xfff2dd,
    keyIntensity: 1.6,
    rimColor: 0x9cc8ff,
    rimIntensity: 0.4,
  },
  {
    id: 'glass',
    name: 'زجاج وثلج',
    squareLight: 0xcfe4f0,
    squareDark: 0x38618c,
    squareRoughness: 0.12,
    base: 0x1b2a3a,
    frame: 0xa8c8e8,
    frameMetalness: 0.6,
    floor: 0x101c28,
    floorRoughness: 0.35,
    skyTop: '#0d1826',
    skyBottom: '#060b12',
    fog: 0x060b12,
    ambient: 0.7,
    keyColor: 0xe8f4ff,
    keyIntensity: 1.4,
    rimColor: 0x7dd3fc,
    rimIntensity: 0.5,
    pieceWhite: 0xf4faff,
    pieceBlack: 0x2c4a66,
  },
  {
    id: 'neon',
    name: 'نيون ليلي',
    squareLight: 0x1e2233,
    squareDark: 0x0c0e18,
    squareRoughness: 0.4,
    base: 0x0a0c14,
    frame: 0xffd166,
    frameMetalness: 0.9,
    floor: 0x05060c,
    floorRoughness: 0.5,
    skyTop: '#0a0618',
    skyBottom: '#040208',
    fog: 0x040208,
    ambient: 0.45,
    keyColor: 0xc4b5fd,
    keyIntensity: 1.3,
    rimColor: 0xf472b6,
    rimIntensity: 0.65,
    pieceWhite: 0xe8e4ff,
    pieceBlack: 0x16121f,
  },
]

export const DEFAULT_THEME = 'marble'
