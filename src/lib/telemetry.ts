'use client'

// Per-match telemetry for the anti-cheat signals: how long each user move
// took, and whether the tab lost focus or a paste happened mid-game. Collected
// only while a game is live, sent with the game record, and only ever used as
// review hints for the admin - never for automatic action.

export interface MatchSignals {
  blurs: number
  pastes: number
  focus_losses: number
  level?: number
}

export interface MatchTelemetryPayload {
  move_times: number[]
  signals: MatchSignals
}

export class MatchTelemetry {
  private lastAt = 0
  private startedAt = 0
  private times: number[] = []
  private blurs = 0
  private pastes = 0
  private live = false

  private onVis = () => {
    if (this.live && document.visibilityState === 'hidden') this.blurs++
  }
  private onBlur = () => {
    if (this.live) this.blurs++
  }
  private onPaste = () => {
    if (this.live) this.pastes++
  }

  start() {
    if (typeof window === 'undefined') return
    this.stop()
    this.times = []
    this.blurs = 0
    this.pastes = 0
    this.live = true
    this.lastAt = Date.now()
    this.startedAt = this.lastAt
    document.addEventListener('visibilitychange', this.onVis)
    window.addEventListener('blur', this.onBlur)
    document.addEventListener('paste', this.onPaste)
  }

  /** call after every half-move so user time measures thinking, not engine time */
  tick(userJustMoved: boolean) {
    if (!this.live) return
    const now = Date.now()
    if (userJustMoved && this.times.length < 400) this.times.push(now - this.lastAt)
    this.lastAt = now
  }

  stop() {
    if (typeof window === 'undefined') return
    this.live = false
    document.removeEventListener('visibilitychange', this.onVis)
    window.removeEventListener('blur', this.onBlur)
    document.removeEventListener('paste', this.onPaste)
  }

  finish(level?: number): MatchTelemetryPayload {
    this.stop()
    return { move_times: this.times, signals: { blurs: this.blurs, pastes: this.pastes, focus_losses: this.blurs, ...(level ? { level } : {}) } }
  }

  /** whole-game seconds from start() to now, 0 when never started */
  durationSeconds(): number {
    return this.startedAt ? Math.max(0, Math.round((Date.now() - this.startedAt) / 1000)) : 0
  }
}
