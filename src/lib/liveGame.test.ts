import { describe, expect, it } from 'vitest'
import { LiveGameSession } from './liveGame'

const deferred = <T>() => {
  let resolve!: (v: T) => void, reject!: (e: unknown) => void
  const p = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { p, resolve, reject }
}

describe('LiveGameSession', () => {
  it('relays moves in order even when pushes are fast', async () => {
    const seen: string[] = []
    const gates: ReturnType<typeof deferred>[] = []
    const sess = new LiveGameSession(7, () => {
      const d = deferred<unknown>()
      gates.push(d)
      return d.p.then(() => seen.push('x'))
    })
    sess.push('e2e4')
    sess.push('e7e5')
    sess.push('g1f3')
    await new Promise((r) => setTimeout(r, 0))
    expect(gates.length).toBe(1) // second move waits for the first
    gates[0].resolve(null)
    await new Promise((r) => setTimeout(r, 0))
    expect(gates.length).toBe(2)
    gates[1].resolve(null)
    await new Promise((r) => setTimeout(r, 0))
    expect(gates.length).toBe(3)
    gates[2].resolve(null)
    await (sess as unknown as { q: Promise<unknown> }).q.catch(() => {})
    expect(sess.broken).toBe(false)
  })

  it('marks broken on failure and reports legacy on end', async () => {
    const sess = new LiveGameSession(7, () => Promise.reject(new Error('offline')))
    sess.push('e2e4')
    const fate = await sess.end('win', null)
    expect(fate).toBe('legacy')
    expect(sess.broken).toBe(true)
  })

  it('ends live when the queue is healthy', async () => {
    let ended = false
    const sess = new LiveGameSession(7, () => Promise.resolve(), () => { ended = true; return Promise.resolve() })
    sess.push('e2e4')
    const fate = await sess.end('win', { blurs: 0 })
    expect(fate).toBe('live')
    expect(ended).toBe(true)
  })
})
