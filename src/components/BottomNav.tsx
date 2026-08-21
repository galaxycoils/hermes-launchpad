import React from 'react'
import { useNavigate } from 'react-router'
import { useHaptic } from '@/hooks/useHaptic'

interface BottomNavProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
  onCreateClick?: () => void
  unreadCount?: number
  className?: string
}

export default function BottomNav({
  activeTab = 'home',
  onTabChange,
  onCreateClick,
  unreadCount = 0,
  className = '',
}: BottomNavProps) {
  const navigate = useNavigate()
  const { trigger: triggerHaptic } = useHaptic()

  const handleTab = (id: string, path: string) => {
    triggerHaptic('light')
    onTabChange?.(id)
    navigate(path)
  }

  const handleCreate = () => {
    triggerHaptic('medium')
    if (onCreateClick) {
      onCreateClick()
    } else {
      navigate('/?create=1')
    }
  }

  const isHome = activeTab === 'home' || activeTab === 'feed' || activeTab === 'tokens'
  const isProfile = activeTab === 'profile' || activeTab === 'portfolio'

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-void/95 backdrop-blur-xl sm:hidden ${className}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Mobile navigation"
      data-testid="bottom-nav"
    >
      <div className="flex h-14 items-center justify-around px-6">
        {/* Feed Tab */}
        <button
          type="button"
          onClick={() => handleTab('home', '/')}
          aria-label="Feed"
          aria-current={isHome ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            isHome ? 'text-white' : 'text-white/40 hover:text-white/70'
          }`}
        >
          <span className="text-xl leading-none">📡</span>
          <span className="text-[10px] font-display font-bold uppercase tracking-wider">Feed</span>
          {isHome && <span className="h-1 w-5 rounded-full iris-gradient" />}
        </button>

        {/* Create Token Center Button */}
        <button
          type="button"
          onClick={handleCreate}
          aria-label="Create Token"
          className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full iris-gradient text-white shadow-[0_0_20px_rgba(124,106,255,0.4)] transition-transform active:scale-95"
        >
          <span className="text-2xl font-bold leading-none">＋</span>
        </button>

        {/* Profile Tab */}
        <button
          type="button"
          onClick={() => handleTab('profile', '/profile')}
          aria-label="Profile"
          aria-current={isProfile ? 'page' : undefined}
          className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
            isProfile ? 'text-white' : 'text-white/40 hover:text-white/70'
          }`}
        >
          <span className="text-xl leading-none">👤</span>
          <span className="text-[10px] font-display font-bold uppercase tracking-wider">Profile</span>
          {isProfile && <span className="h-1 w-5 rounded-full iris-gradient" />}
          {unreadCount > 0 && (
            <span className="absolute -top-1 right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-bleed px-1 text-[9px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  )
}
