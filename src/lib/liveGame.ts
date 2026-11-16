'use client'

// Client half of the live server-authoritative games (anti-cheat). Every
// half-move is relayed to the worker, which validates it against the stored
// position and stamps it with the server clock. Moves are queued so they
// always arrive in order; if anything fails (offline, server error, out of
// sync) the session is marked broken and the caller falls back to the old
// post-game upload, so a network hiccup never loses a game record.

import { getToken, liveEnd, liveMove, liveStart } from './api'

export type LivePoster = (id: number, uci: string) => Promise<unknown>
export type LiveStarter = (opponent: string, color: 'white' | 'black') => Promise<{ id: number }>
export type LiveEnder = (id: number, result: 'win' | 'loss' | 'draw', signals: unknown) => Promise<unknown>

export class LiveGameSession {
  private q: Promise<unknown> = Promise.resolve()
  broken = false

  constructor(
    public readonly id: number,
    private postMove: LivePoster = (i, u) => liveMove(i, u),
    private postEnd: LiveEnder = (i, r, s) => liveEnd(i, r, s),
  ) {}

  /** null when logged out or the server could not start a live game */
  static async start(
    opponent: string,
    color: 'white' | 'black',
    starter: LiveStarter = async (o, c) => ({ id: (await liveStart(o, c)).live.id }),
  ): Promise<LiveGameSession | null> {
    if (!getToken()) return null
    try {
      const { id } = await starter(opponent, color)
      return new LiveGameSession(id)
    } catch {
      return null
    }
  }

  /** queue a half-move; order is preserved even if the user plays fast */
  push(uci: string) {
    if (this.broken) return
    this.q = this.q.then(() => this.postMove(this.id, uci)).catch(() => {
      this.broken = true
    })
  }

  /** 'live' = the server finalized and recorded the game; 'legacy' = caller must save it the old way */
  async end(result: 'win' | 'loss' | 'draw', signals: unknown): Promise<'live' | 'legacy'> {
    if (this.broken) return 'legacy'
    try {
      await this.q
      if (this.broken) return 'legacy'
      await this.postEnd(this.id, result, signals)
      return 'live'
    } catch {
      this.broken = true
      return 'legacy'
    }
  }
}
