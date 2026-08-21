import React from 'react'

interface SkeletonProps {
  className?: string
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer bg-gradient-to-r from-white/[0.04] via-iris/10 to-white/[0.04] bg-[length:200%_100%] rounded-md overflow-hidden ${className}`}
    />
  )
}

export function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="group relative flex flex-col justify-between w-full rounded-2xl border border-white/[0.04] bg-obsidian/40 p-3.5 text-left"
      style={{ animationDelay: `${delay * 100}ms` }}
    >
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
        <Skeleton className="h-5 w-14 rounded" />
      </div>

      <div className="my-3">
        <Skeleton className="h-7 w-full rounded" />
      </div>

      <div className="space-y-1.5 pt-1 border-t border-white/[0.04]">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
    </div>
  )
}
