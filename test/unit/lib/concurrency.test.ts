import { describe, it, expect } from 'vitest'
import { pLimit } from '../../../src/lib/concurrency'

describe('pLimit', () => {
  it('runs all functions and returns results in order', async () => {
    const limit = pLimit(2)
    const tasks = [1, 2, 3, 4].map((n) => limit(async () => n * 2))
    expect(await Promise.all(tasks)).toEqual([2, 4, 6, 8])
  })

  it('never runs more than N concurrently', async () => {
    const limit = pLimit(2)
    let active = 0
    let peak = 0
    const tasks = Array.from({ length: 10 }, () =>
      limit(async () => {
        active++
        peak = Math.max(peak, active)
        await new Promise((r) => setTimeout(r, 5))
        active--
      }),
    )
    await Promise.all(tasks)
    expect(peak).toBeLessThanOrEqual(2)
  })

  it('rejects when the function throws but keeps processing the rest', async () => {
    const limit = pLimit(2)
    const results = await Promise.allSettled([
      limit(async () => 1),
      limit(async () => {
        throw new Error('boom')
      }),
      limit(async () => 3),
    ])
    expect(results.map((r) => r.status)).toEqual(['fulfilled', 'rejected', 'fulfilled'])
  })
})
