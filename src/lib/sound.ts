// Small synthesized sounds (no audio files to download), with selectable sound packs.
let ctx: AudioContext | null = null
let enabled = true
let volume = 0.8
let pack: SoundPackId = 'wood'

export type SoundPackId = 'wood' | 'marble' | 'glass' | 'classic' | 'soft' | 'arcade'

export interface SoundPack {
  id: SoundPackId
  name: string
}

export const SOUND_PACKS: SoundPack[] = [
  { id: 'wood', name: 'خشب' },
  { id: 'marble', name: 'رخام' },
  { id: 'glass', name: 'زجاج' },
  { id: 'classic', name: 'بطولة كلاسيك' },
  { id: 'soft', name: 'هادي' },
  { id: 'arcade', name: 'أركيد' },
]

interface PackProfile {
  knockFreq: number
  knockQ: number
  knockDur: number
  gain: number
  body: number
  toneType: OscillatorType
  melodic: boolean
}

const PROFILES: Record<SoundPackId, PackProfile> = {
  wood: { knockFreq: 1800, knockQ: 3, knockDur: 1, gain: 1, body: 0.5, toneType: 'sine', melodic: false },
  marble: { knockFreq: 2500, knockQ: 6, knockDur: 0.8, gain: 0.9, body: 0.25, toneType: 'sine', melodic: false },
  glass: { knockFreq: 3300, knockQ: 9, knockDur: 0.6, gain: 0.8, body: 0.15, toneType: 'sine', melodic: false },
  classic: { knockFreq: 1150, knockQ: 4, knockDur: 0.7, gain: 1, body: 0.15, toneType: 'sine', melodic: false },
  soft: { knockFreq: 1500, knockQ: 1.6, knockDur: 1.1, gain: 0.45, body: 0.7, toneType: 'sine', melodic: false },
  arcade: { knockFreq: 900, knockQ: 2, knockDur: 0.9, gain: 0.5, body: 0, toneType: 'square', melodic: true },
}

export function setSoundEnabled(on: boolean) {
  enabled = on
}

export function setSoundVolume(v: number) {
  volume = Math.min(1, Math.max(0, v))
}

export function setSoundPack(id: SoundPackId) {
  if (id in PROFILES) pack = id
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function knock(freq: number, dur: number, gain: number, delay = 0) {
  const a = ac()
  if (!a) return
  const p = PROFILES[pack]
  const f = (freq / 1800) * p.knockFreq
  const d = dur * p.knockDur
  const g0 = gain * p.gain * volume
  const t = a.currentTime + delay
  // a filtered noise burst gives the "click"
  const len = Math.floor(a.sampleRate * d)
  const buf = a.createBuffer(1, len, a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  const src = a.createBufferSource()
  src.buffer = buf
  const bp = a.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = f
  bp.Q.value = p.knockQ
  const g = a.createGain()
  g.gain.setValueAtTime(g0, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + d)
  src.connect(bp).connect(g).connect(a.destination)
  src.start(t)
  // a short tone body
  if (p.body > 0) {
    const o = a.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(f / 4, t)
    o.frequency.exponentialRampToValueAtTime(f / 8, t + d)
    const og = a.createGain()
    og.gain.setValueAtTime(g0 * p.body, t)
    og.gain.exponentialRampToValueAtTime(0.0001, t + d)
    o.connect(og).connect(a.destination)
    o.start(t)
    o.stop(t + d)
  }
}

function tone(freq: number, dur: number, gain: number, delay = 0, type?: OscillatorType) {
  const a = ac()
  if (!a) return
  const p = PROFILES[pack]
  const t = a.currentTime + delay
  const o = a.createOscillator()
  o.type = type ?? p.toneType
  o.frequency.value = freq
  const g = a.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain * volume, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(a.destination)
  o.start(t)
  o.stop(t + dur + 0.05)
}

export type SoundName = 'move' | 'capture' | 'check' | 'castle' | 'promote' | 'success' | 'error' | 'end' | 'notify'

export function play(name: SoundName) {
  if (!enabled) return
  try {
    const p = PROFILES[pack]
    if (p.melodic) {
      // أركيد: بليبس موسيقية بدل الطقطقة
      switch (name) {
        case 'move':
          tone(520, 0.07, 0.08)
          tone(780, 0.06, 0.07, 0.05)
          return
        case 'capture':
          tone(392, 0.08, 0.09)
          tone(262, 0.1, 0.08, 0.06)
          return
        case 'castle':
          tone(520, 0.06, 0.08)
          tone(660, 0.06, 0.08, 0.06)
          tone(780, 0.08, 0.08, 0.12)
          return
        case 'check':
          tone(880, 0.08, 0.09)
          tone(880, 0.08, 0.09, 0.11)
          return
        case 'promote':
          tone(523, 0.07, 0.08)
          tone(659, 0.07, 0.08, 0.07)
          tone(784, 0.07, 0.08, 0.14)
          tone(1047, 0.12, 0.08, 0.21)
          return
        default:
          break
      }
    }
    switch (name) {
      case 'move':
        knock(1800, 0.08, 0.5)
        break
      case 'capture':
        knock(1400, 0.1, 0.7)
        knock(2200, 0.06, 0.35, 0.035)
        break
      case 'castle':
        knock(1800, 0.07, 0.45)
        knock(1700, 0.07, 0.45, 0.09)
        break
      case 'check':
        knock(1600, 0.08, 0.6)
        tone(880, 0.18, 0.06, 0.02, 'triangle')
        break
      case 'promote':
        knock(1800, 0.07, 0.5)
        tone(660, 0.12, 0.05, 0.03)
        tone(990, 0.2, 0.05, 0.12)
        break
      case 'success':
        tone(523.25, 0.18, 0.07)
        tone(659.25, 0.18, 0.07, 0.1)
        tone(783.99, 0.32, 0.07, 0.2)
        break
      case 'error':
        tone(220, 0.18, 0.06, 0, 'triangle')
        tone(185, 0.22, 0.05, 0.1, 'triangle')
        break
      case 'end':
        tone(392, 0.25, 0.07)
        tone(523.25, 0.25, 0.07, 0.15)
        tone(659.25, 0.5, 0.07, 0.3)
        break
      case 'notify':
        tone(880, 0.12, 0.05)
        tone(1320, 0.18, 0.04, 0.08)
        break
    }
  } catch {
    /* audio is optional */
  }
}
