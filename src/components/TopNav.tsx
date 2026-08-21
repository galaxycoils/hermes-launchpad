import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router'
import { toast, Toaster } from 'sonner'
import Avatar from '@/components/Avatar'
import { connectWallet } from '@/lib/wallet'
import { useInterval } from '@/hooks/useInterval'
import { useSoundEffect } from '@/hooks/useSoundEffect'

interface TopNavProps {
  wallet: string | null
  onWalletChange?: (wallet: string | null) => void
  live?: boolean
  refCode?: string
  streak?: number
  rank?: number
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

function formatSol(lamports: number): string {
  return (lamports / 1_000_000_000).toFixed(2)
}

function isDevnet(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host.includes('workers') || host.includes('dev') || host.includes('localhost') || host.includes('pages.dev')
}

async function fetchBalance(wallet: string): Promise<number | null> {
  try {
    const res = await fetch(`/api/balance?wallet=${encodeURIComponent(wallet)}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.balance === 'number' ? data.balance : null
  } catch {
    return null
  }
}

export default function TopNav({
  wallet,
  onWalletChange,
  streak,
  rank,
}: TopNavProps) {
  const [showWalletMenu, setShowWalletMenu] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const { enabled: soundOn, toggle: toggleSound } = useSoundEffect()
  const devnet = isDevnet()

  const handleCopyAddress = useCallback(async () => {
    if (!wallet) return
    try {
      await navigator.clipboard.writeText(wallet)
      setCopied(true)
      toast.success('Address copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy address')
    }
  }, [wallet])

  useEffect(() => {
    if (!wallet) return
    let cancelled = false
    fetchBalance(wallet).then((b) => {
      if (!cancelled) setBalance(b)
    })
    return () => {
      cancelled = true
    }
  }, [wallet])

  useInterval(() => {
    if (wallet && showWalletMenu) {
      fetchBalance(wallet).then((b) => {
        if (b !== null) setBalance(b)
      })
    }
  }, 10000)

  return (
    <>
      {devnet && (
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-center text-xs font-bold text-yellow-300">
          Devnet preview — not mainnet. Use a Devnet wallet and faucet SOL.
        </div>
      )}
      <nav className="sticky top-0 z-40 h-12 w-full border-b border-white/[0.06] bg-void/90 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-3 sm:px-4">
          {/* Left: Brand */}
          <Link to="/" className="flex items-center gap-2 group" aria-label="Hermes Launchpad Home">
            <span className="text-xl select-none group-hover:scale-110 transition-transform">🛸</span>
            <div className="flex items-center">
              <span className="font-display font-black tracking-tight text-base text-white">HERMES</span>
              <span className="h-1.5 w-1.5 rounded-full bg-pulse ml-1 animate-pulse" />
            </div>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 1-Tap Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              title={soundOn ? 'Sound on (click to mute)' : 'Sound off (click to unmute)'}
              aria-label={soundOn ? 'Mute audio' : 'Unmute audio'}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-colors ${
                soundOn
                  ? 'border-iris/40 bg-iris/15 text-iris-start'
                  : 'border-white/10 bg-white/5 text-white/40 hover:text-white'
              }`}
            >
              {soundOn ? '🔊' : '🔇'}
            </button>

            {/* Streak Badge */}
            {Boolean(streak && streak > 0) && (
              <div
                className="flex items-center gap-1 rounded-lg border border-sol/30 bg-sol/10 px-2 py-1 text-xs font-mono font-bold text-sol"
                title={`${streak} day trading streak`}
              >
                <span>🔥</span>
                <span>{streak}d</span>
              </div>
            )}

            {/* Rank / Profile Link */}
            <Link
              to="/profile"
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-display font-bold text-white/70 hover:border-iris/40 hover:text-white transition-colors"
            >
              <span>👤</span>
              <span className="hidden sm:inline">{rank ? `Rank #${rank}` : 'Profile'}</span>
            </Link>

            {/* Wallet Button */}
            <button
              type="button"
              onClick={async (e) => {
                if (wallet) {
                  e.stopPropagation()
                  setShowWalletMenu(!showWalletMenu)
                } else if (onWalletChange) {
                  await connectWallet(onWalletChange)
                  setShowWalletMenu(true)
                }
              }}
              className="flex items-center gap-1.5 rounded-xl bg-iris px-3 py-1.5 text-xs font-display font-black text-white hover:bg-iris/90 shadow-[0_0_15px_rgba(124,106,255,0.25)] transition-all active:scale-[0.98]"
            >
              {wallet ? (
                <span className="font-mono">{truncateAddress(wallet)}</span>
              ) : (
                <span>Connect</span>
              )}
            </button>
          </div>
        </div>

        {/* Wallet dropdown */}
        {showWalletMenu && wallet && (
          <div
            className="absolute right-4 top-full z-50 mt-1.5 w-72 rounded-2xl border border-white/10 bg-obsidian p-4 shadow-2xl backdrop-blur-xl animate-fly-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <Avatar value={wallet} size="lg" connected />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-white truncate">{truncateAddress(wallet)}</span>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="text-white/40 hover:text-white text-xs"
                    title="Copy address"
                    aria-label="Copy address"
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                </div>
                <span className="text-[10px] text-pulse font-mono">● Connected Devnet</span>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between text-xs font-mono">
              <span className="text-white/40">Balance</span>
              <span className="font-bold text-white">
                {balance !== null ? `${formatSol(balance)} SOL` : '…'}
              </span>
            </div>

            <div className="pt-2 border-t border-white/5 space-y-1">
              <a
                href={`https://solscan.io/account/${wallet}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-white transition-colors"
              >
                <span>View on Solscan</span>
                <span>↗</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  onWalletChange?.(null)
                  setShowWalletMenu(false)
                  setBalance(null)
                }}
                className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-bleed hover:bg-bleed/10 transition-colors"
              >
                <span>Disconnect</span>
                <span>⏻</span>
              </button>
            </div>
          </div>
        )}

        {/* Click-away overlay */}
        {showWalletMenu && (
          <div className="fixed inset-0 z-40" onClick={() => setShowWalletMenu(false)} />
        )}
      </nav>

      <Toaster richColors position="top-center" />
    </>
  )
}