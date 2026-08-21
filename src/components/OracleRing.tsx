import React from 'react'

export interface OracleRingProps {
  score?: number
  isDemo?: boolean
  size?: 'sm' | 'md' | 'lg'
  children?: React.ReactNode
  className?: string
}

export default function OracleRing({
  score,
  isDemo = false,
  size = 'md',
  children,
  className = '',
}: OracleRingProps) {
  const sizeMap = {
    sm: { container: 'w-8 h-8', svg: 32, stroke: 2, radius: 14, text: 'text-sm' },
    md: { container: 'w-12 h-12', svg: 48, stroke: 2.5, radius: 21, text: 'text-2xl' },
    lg: { container: 'w-16 h-16', svg: 64, stroke: 3, radius: 28, text: 'text-3xl' },
  }

  const { container, svg, stroke, radius } = sizeMap[size] || sizeMap.md
  const circumference = 2 * Math.PI * radius

  // Determine stroke color
  let strokeColor = 'url(#oracle-iris-grad)'
  let isDashed = false

  if (isDemo) {
    strokeColor = '#555566'
    isDashed = true
  } else if (score !== undefined) {
    if (score < 30) strokeColor = '#00ff66' // Pulse green (low risk)
    else if (score <= 70) strokeColor = '#ffb800' // Sol amber (medium risk)
    else strokeColor = '#ff3344' // Bleed red (high risk)
  }

  const offset = score !== undefined ? circumference - (score / 100) * circumference : 0

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${container} ${className}`}
      data-testid="oracle-ring"
      data-risk-score={score ?? 'unscored'}
    >
      <svg
        width={svg}
        height={svg}
        viewBox={`0 0 ${svg} ${svg}`}
        className="absolute inset-0 -rotate-90 pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="oracle-iris-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c6aff" />
            <stop offset="100%" stopColor="#00e5ff" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={svg / 2}
          cy={svg / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={stroke}
        />
        {/* Score indicator / active ring */}
        <circle
          cx={svg / 2}
          cy={svg / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeDasharray={isDashed ? '3 3' : circumference}
          strokeDashoffset={score !== undefined ? offset : 0}
          strokeLinecap="round"
          className={score === undefined && !isDemo ? 'animate-spin-slow' : 'transition-all duration-500'}
        />
      </svg>
      <div className="relative z-10 flex items-center justify-center select-none">
        {children}
      </div>
    </div>
  )
}
