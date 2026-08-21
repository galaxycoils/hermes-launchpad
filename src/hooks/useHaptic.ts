import { useCallback } from 'react'
import { haptic, type HapticStyle } from '@/lib/haptic'

export function useHaptic() {
  const trigger = useCallback((style: HapticStyle = 'light') => {
    haptic(style)
  }, [])

  return { trigger, haptic: trigger }
}
