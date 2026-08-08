import { beforeAll, afterEach } from 'vitest'

// WU-00 Step 0 — minimal jsdom setup. Expanded per-project as unit/client/integration grow.
beforeAll(() => {
  if (typeof window !== 'undefined') {
    if (!window.matchMedia) {
      // @ts-expect-error test stub
      window.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      })
    }
  }
})

afterEach(() => {
  if (typeof document !== 'undefined') {
    document.body.innerHTML = ''
  }
})
