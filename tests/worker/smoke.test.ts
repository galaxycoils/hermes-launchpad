import { describe, it, expect } from 'vitest'

describe('worker harness smoke', () => {
  it('runs in node env', () => {
    expect(typeof process).toBe('object')
    expect(1 + 1).toBe(2)
  })
})
