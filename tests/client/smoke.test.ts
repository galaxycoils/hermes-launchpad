import { describe, it, expect } from 'vitest'

describe('client harness smoke', () => {
  it('runs in jsdom', () => {
    expect(document).toBeDefined()
    expect(1 + 1).toBe(2)
  })
})
