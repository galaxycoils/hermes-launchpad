export type HapticStyle = 'light' | 'medium' | 'heavy'

export function haptic(style: HapticStyle): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return // Silent fallback for iOS Safari / desktop
  }

  try {
    const patterns: Record<HapticStyle, number[]> = {
      light: [10],
      medium: [20],
      heavy: [30, 10, 30],
    }
    navigator.vibrate(patterns[style] || [10])
  } catch {
    // Silent fallback
  }
}
