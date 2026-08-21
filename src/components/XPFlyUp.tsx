import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface XPFlyUpProps {
  amount?: number
  visible: boolean
  onComplete?: () => void
  className?: string
}

export default function XPFlyUp({
  amount = 50,
  visible,
  onComplete,
  className = '',
}: XPFlyUpProps) {
  const elRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible || !elRef.current) return

    const el = elRef.current
    gsap.fromTo(
      el,
      { opacity: 0, y: 0, scale: 0.8 },
      {
        opacity: 1,
        y: -40,
        scale: 1.2,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(el, {
            opacity: 0,
            y: -70,
            scale: 0.9,
            duration: 0.4,
            ease: 'power1.in',
            onComplete: () => onComplete?.(),
          })
        },
      }
    )
  }, [visible, onComplete])

  if (!visible) return null

  return (
    <div
      ref={elRef}
      className={`pointer-events-none fixed z-50 flex items-center gap-1 rounded-full border border-sol/40 bg-void/90 px-3 py-1 font-display font-black text-sm text-sol shadow-[0_0_20px_rgba(255,184,0,0.5)] ${className}`}
      data-testid="xp-flyup"
    >
      <span>⚡</span>
      <span>+{amount} XP</span>
    </div>
  )
}
