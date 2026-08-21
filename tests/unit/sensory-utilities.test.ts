import { describe, it, expect, vi, beforeEach } from 'vitest'
import { soundManager } from '@/lib/sound'
import { haptic } from '@/lib/haptic'
import { triggerConfetti } from '@/lib/confetti-presets'

describe('Sensory Utilities', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('SoundManager', () => {
    it('defaults to sound enabled false if not set or set to off', () => {
      expect(soundManager.isEnabled()).toBe(false)
    })

    it('allows toggling sound on and off and persists to localStorage', () => {
      soundManager.setEnabled(true)
      expect(soundManager.isEnabled()).toBe(true)
      expect(localStorage.getItem('hermes-sound')).toBe('on')

      soundManager.setEnabled(false)
      expect(soundManager.isEnabled()).toBe(false)
      expect(localStorage.getItem('hermes-sound')).toBe('off')
    })

    it('unlocks audio context on unlock() call', () => {
      soundManager.unlock()
      expect(soundManager.isUnlocked()).toBe(true)
    })

    it('plays synthesized sound effects without error when enabled', () => {
      soundManager.setEnabled(true)
      soundManager.unlock()
      expect(() => soundManager.play('trade')).not.toThrow()
      expect(() => soundManager.play('levelUp')).not.toThrow()
      expect(() => soundManager.play('quest')).not.toThrow()
      expect(() => soundManager.play('streak')).not.toThrow()
      expect(() => soundManager.play('king')).not.toThrow()
      expect(() => soundManager.play('click')).not.toThrow()
    })

    it('does not play sounds when disabled', () => {
      soundManager.setEnabled(false)
      expect(() => soundManager.play('trade')).not.toThrow()
    })
  })

  describe('Haptics', () => {
    it('calls navigator.vibrate with appropriate vibration patterns', () => {
      const vibrateMock = vi.fn(() => true)
      navigator.vibrate = vibrateMock

      haptic('light')
      expect(vibrateMock).toHaveBeenCalledWith([10])

      haptic('medium')
      expect(vibrateMock).toHaveBeenCalledWith([20])

      haptic('heavy')
      expect(vibrateMock).toHaveBeenCalledWith([30, 10, 30])
    })

    it('handles environments without navigator.vibrate gracefully', () => {
      const originalVibrate = navigator.vibrate
      // @ts-expect-error simulate unsupported browser
      delete navigator.vibrate

      expect(() => haptic('light')).not.toThrow()

      // restore
      navigator.vibrate = originalVibrate
    })
  })

  describe('Confetti Presets', () => {
    it('triggers trade, levelUp, and graduation confetti without error', () => {
      expect(() => triggerConfetti('trade')).not.toThrow()
      expect(() => triggerConfetti('levelUp')).not.toThrow()
      expect(() => triggerConfetti('graduation')).not.toThrow()
    })
  })
})
