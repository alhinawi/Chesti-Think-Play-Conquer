// Small synthesized sounds (no audio files to download).
let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(on: boolean) {
  enabled = on
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
  const t = a.currentTime + delay
  // a filtered noise burst gives the "wood" click
  const len = Math.floor(a.sampleRate * dur)
  const buf = a.createBuffer(1, len, a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  const src = a.createBufferSource()
  src.buffer = buf
  const bp = a.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = freq
  bp.Q.value = 3
  const g = a.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(bp).connect(g).connect(a.destination)
  src.start(t)
  // a short tone body
  const o = a.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(freq / 4, t)
  o.frequency.exponentialRampToValueAtTime(freq / 8, t + dur)
  const og = a.createGain()
  og.gain.setValueAtTime(gain * 0.5, t)
  og.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(og).connect(a.destination)
  o.start(t)
  o.stop(t + dur)
}

function tone(freq: number, dur: number, gain: number, delay = 0, type: OscillatorType = 'sine') {
  const a = ac()
  if (!a) return
  const t = a.currentTime + delay
  const o = a.createOscillator()
  o.type = type
  o.frequency.value = freq
  const g = a.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(a.destination)
  o.start(t)
  o.stop(t + dur + 0.05)
}

export type SoundName = 'move' | 'capture' | 'check' | 'castle' | 'promote' | 'success' | 'error' | 'end' | 'notify'

export function play(name: SoundName) {
  if (!enabled) return
  try {
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
