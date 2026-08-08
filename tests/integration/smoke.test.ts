import { describe, it, expect } from 'vitest'

describe('integration harness smoke', () => {
  it('runs in jsdom', () => {
    expect(window).toBeDefined()
    expect(1 + 1).toBe(2)
  })
})
