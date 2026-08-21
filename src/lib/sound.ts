export type SoundType = 'trade' | 'levelUp' | 'quest' | 'streak' | 'king' | 'click'

export class SoundManager {
  private ctx: AudioContext | null = null
  private unlocked = false
  private enabled = false
  private listeners: Set<(enabled: boolean) => void> = new Set()

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hermes-sound')
      this.enabled = stored === 'on'

      // Listen for document visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.ctx?.suspend()
        } else if (this.unlocked) {
          this.ctx?.resume()
        }
      })

      // Auto-unlock on first pointer interaction
      const onFirstGesture = () => {
        this.unlock()
        window.removeEventListener('pointerdown', onFirstGesture)
        window.removeEventListener('click', onFirstGesture)
        window.removeEventListener('keydown', onFirstGesture)
      }
      window.addEventListener('pointerdown', onFirstGesture, { once: true })
      window.addEventListener('click', onFirstGesture, { once: true })
      window.addEventListener('keydown', onFirstGesture, { once: true })
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx =
        (typeof window !== 'undefined' &&
          (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)) ||
        (typeof globalThis !== 'undefined' &&
          (globalThis.AudioContext ||
            (globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext))

      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    return this.ctx
  }

  unlock(): void {
    if (this.unlocked) return
    const ctx = this.ensureContext()
    if (!ctx) {
      this.unlocked = true
      return
    }

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    try {
      const buf = ctx.createBuffer(1, 1, 22050)
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.connect(ctx.destination)
      src.start(0)
      this.unlocked = true
    } catch {
      this.unlocked = true
    }
  }

  isUnlocked(): boolean {
    return this.unlocked
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hermes-sound', enabled ? 'on' : 'off')
    }
    this.listeners.forEach((fn) => fn(enabled))
  }

  toggle(): boolean {
    this.setEnabled(!this.enabled)
    return this.enabled
  }

  subscribe(listener: (enabled: boolean) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  play(type: SoundType): void {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime

    try {
      switch (type) {
        case 'click': {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(800, now)
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.04)
          gain.gain.setValueAtTime(0.08, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.04)
          break
        }
        case 'trade': {
          // Double chime (cha-ching)
          const notes = [587.33, 880] // D5 -> A5
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            const t = now + idx * 0.08
            osc.type = 'triangle'
            osc.frequency.setValueAtTime(freq, t)
            gain.gain.setValueAtTime(0.12, t)
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(t)
            osc.stop(t + 0.2)
          })
          break
        }
        case 'levelUp': {
          // Ascending fanfare
          const chord = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
          chord.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            const t = now + idx * 0.1
            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, t)
            gain.gain.setValueAtTime(0.15, t)
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(t)
            osc.stop(t + 0.35)
          })
          break
        }
        case 'quest': {
          // Achievement chime
          const notes = [659.25, 880, 1174.66] // E5, A5, D6
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            const t = now + idx * 0.07
            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, t)
            gain.gain.setValueAtTime(0.1, t)
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(t)
            osc.stop(t + 0.25)
          })
          break
        }
        case 'streak': {
          // Whoosh upwards
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(300, now)
          osc.frequency.exponentialRampToValueAtTime(900, now + 0.2)
          gain.gain.setValueAtTime(0.1, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.2)
          break
        }
        case 'king': {
          // Royal fanfare
          const notes = [440, 554.37, 659.25, 880] // A4, C#5, E5, A5
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            const t = now + idx * 0.09
            osc.type = 'triangle'
            osc.frequency.setValueAtTime(freq, t)
            gain.gain.setValueAtTime(0.14, t)
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(t)
            osc.stop(t + 0.4)
          })
          break
        }
      }
    } catch {
      // Audio playback failed silently
    }
  }
}

export const soundManager = new SoundManager()
