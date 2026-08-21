import React from 'react'

export interface SparklineProps {
  data?: number[]
  positive?: boolean
  height?: number
  width?: number
  className?: string
}

export default function Sparkline({
  data = [],
  positive = true,
  height = 32,
  width = 240,
  className = '',
}: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div
        className={`flex items-center justify-center text-[10px] font-mono text-white/20 h-[${height}px] ${className}`}
        style={{ height }}
        data-testid="sparkline-empty"
      >
        <span>— no price history —</span>
      </div>
    )
  }

  const pad = 2
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2)
    const y = height - pad - ((v - min) / range) * (height - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const linePoints = points.join(' ')
  const areaPoints = `${pad},${height - pad} ${linePoints} ${width - pad},${height - pad}`

  const strokeColor = positive ? '#00ff66' : '#ff3344'
  const gradId = `spark-grad-${positive ? 'up' : 'down'}-${height}`

  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ height }} data-testid="sparkline">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill={`url(#${gradId})`} />
        <polyline
          points={linePoints}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
