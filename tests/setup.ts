import { beforeAll, afterEach, vi } from 'vitest'

// Top-level Canvas 2D context mock for jsdom / canvas-confetti
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextId: string) => {
    if (contextId === '2d') {
      return {
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        drawImage: vi.fn(),
        canvas: {},
      }
    }
    return null
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext
}

// Web Audio API mock
class MockAudioNode {
  connect = vi.fn()
  disconnect = vi.fn()
}

class MockAudioParam {
  value = 1
  setValueAtTime = vi.fn()
  exponentialRampToValueAtTime = vi.fn()
  linearRampToValueAtTime = vi.fn()
}

class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam()
}

class MockOscillatorNode extends MockAudioNode {
  type = 'sine'
  frequency = new MockAudioParam()
  start = vi.fn()
  stop = vi.fn()
}

class MockAudioContext {
  state = 'running'
  destination = new MockAudioNode()
  currentTime = 0
  resume = vi.fn().mockResolvedValue(undefined)
  suspend = vi.fn().mockResolvedValue(undefined)
  createGain = vi.fn(() => new MockGainNode())
  createOscillator = vi.fn(() => new MockOscillatorNode())
  createBuffer = vi.fn(() => ({ duration: 0, length: 1, sampleRate: 22050 }))
  createBufferSource = vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }))
  decodeAudioData = vi.fn().mockResolvedValue({})
}

beforeAll(() => {
  if (typeof globalThis !== 'undefined') {
    // @ts-expect-error test mock
    globalThis.AudioContext = MockAudioContext
    // @ts-expect-error test mock
    globalThis.webkitAudioContext = MockAudioContext
  }

  if (typeof window !== 'undefined') {
    // @ts-expect-error test mock
    window.AudioContext = MockAudioContext
    // @ts-expect-error test mock
    window.webkitAudioContext = MockAudioContext

    if (!window.matchMedia) {
      // @ts-expect-error test stub
      window.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
      })
    }

    if (!('IntersectionObserver' in window)) {
      // @ts-expect-error test mock
      window.IntersectionObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }))
    }
  }

  if (typeof Navigator !== 'undefined' && Navigator.prototype) {
    if (!('vibrate' in Navigator.prototype)) {
      Object.defineProperty(Navigator.prototype, 'vibrate', {
        value: vi.fn(() => true),
        writable: true,
        configurable: true,
      })
    }
  }
})

afterEach(() => {
  if (typeof document !== 'undefined') {
    document.body.innerHTML = ''
  }
})
