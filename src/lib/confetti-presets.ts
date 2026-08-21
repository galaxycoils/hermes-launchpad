import confetti from 'canvas-confetti'

export type ConfettiType = 'trade' | 'levelUp' | 'graduation'

export function triggerConfetti(type: ConfettiType): void {
  if (typeof window === 'undefined') return

  try {
    switch (type) {
      case 'trade':
        confetti({
          particleCount: 35,
          spread: 55,
          startVelocity: 25,
          gravity: 0.8,
          colors: ['#00ff66', '#7c6aff', '#00e5ff'],
          origin: { y: 0.8 },
        })
        break
      case 'levelUp':
        confetti({
          particleCount: 100,
          spread: 140,
          startVelocity: 45,
          gravity: 0.6,
          colors: ['#ffb800', '#7c6aff', '#00e5ff', '#00ff66'],
          origin: { y: 0.35 },
        })
        break
      case 'graduation':
        confetti({
          particleCount: 180,
          spread: 180,
          startVelocity: 50,
          gravity: 0.5,
          colors: ['#ffb800', '#ffd60a', '#ffffff', '#7c6aff'],
          origin: { y: 0.5 },
          shapes: ['circle', 'square'],
        })
        break
    }
  } catch {
    // Confetti failure should not break UI
  }
}
