import { useEffect, useState, useCallback } from 'react'
import { soundManager, type SoundType } from '@/lib/sound'

export function useSoundEffect() {
  const [enabled, setEnabled] = useState(() => soundManager.isEnabled())

  useEffect(() => {
    return soundManager.subscribe((nextEnabled) => {
      setEnabled(nextEnabled)
    })
  }, [])

  const play = useCallback((type: SoundType) => {
    soundManager.play(type)
  }, [])

  const toggle = useCallback(() => {
    return soundManager.toggle()
  }, [])

  return { enabled, play, toggle, setEnabled: soundManager.setEnabled.bind(soundManager) }
}
