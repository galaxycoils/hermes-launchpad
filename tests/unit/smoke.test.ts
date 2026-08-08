import { describe, it, expect } from 'vitest'

describe('harness smoke', () => {
  it('vitest runs in jsdom', () => {
    expect(1 + 1).toBe(2)
  })
})
