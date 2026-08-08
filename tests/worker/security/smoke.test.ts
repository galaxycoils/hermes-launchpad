import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// WU-00 security traceability: quarantined fake-write paths MUST be tracked as
// "prohibited" in FEATURE_MATRIX.md until WU-03/04 remove them. This test fails
// closed if the quarantine record is lost.
const MATRIX = resolve(process.cwd(), 'docs/launchpad/FEATURE_MATRIX.md')
const QUARANTINED = [
  'createTokenServer',
  'POST /api/tokens',
  'POST /api/tokens/register',
  'postTrade',
  'POST /api/trades',
]

describe('quarantine traceability', () => {
  const matrix = readFileSync(MATRIX, 'utf8')
  for (const path of QUARANTINED) {
    it(`marks ${path} as prohibited`, () => {
      expect(matrix).toContain(path)
      expect(matrix).toContain('prohibited')
    })
  }
})
