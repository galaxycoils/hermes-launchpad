'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  fetchTokens,
  fetchLeaderboard,
  fetchProfile,
  checkin,
  postComment,
  likeToken,
  fetchTrades,
} from '@/lib/api'
import { getAnonId, captureRef } from '@/lib/identity'
import { connectWallet, useWalletProvider } from '@/lib/wallet'
import { signAuthChallenge } from '@/lib/solana'
import { filterVerifiedTokens } from '@/lib/token-truth'
import type { Token, Profile, Trade } from '@/lib/tokens'
import type { VerifiedTokenFilter } from '@/lib/token-truth'

import TopNav from '@/components/TopNav'
import KOHStrip from '@/components/KOHStrip'
import LiveTicker from '@/components/LiveTicker'
import FilterBar from '@/components/FilterBar'
import TokenCard from '@/components/TokenCard'
import BottomNav from '@/components/BottomNav'
import { SkeletonCard } from '@/components/Skeleton'
import TokenModal from '@/components/TokenModal'
import CreateTokenModal from '@/components/CreateTokenModal'
import GraduationModal from '@/components/GraduationModal'
import WalletSelectorModal from '@/components/WalletSelectorModal'

// Capability-state strings for network fallback:
// - 'Stale · last verified — reconnecting' (leaderboard offline status)

type Filter = VerifiedTokenFilter

export default function Home() {
  const { providerDetected: walletDetected } = useWalletProvider()

  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Token | null>(null)
  const [allTokens, setAllTokens] = useState<Token[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [tokensLoading, setTokensLoading] = useState(true)
  const [tokensError, setTokensError] = useState<string | null>(null)
  const [wallet, setWallet] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showWalletSelector, setShowWalletSelector] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [graduatedToken, setGraduatedToken] = useState<Token | null>(null)

  const [anonId] = useState(getAnonId)
  const identity = wallet ?? anonId

  // Auto-connect when provider detected
  useEffect(() => {
    if (walletDetected) {
      connectWallet(setWallet)
    }
  }, [walletDetected])

  const checkGraduations = useCallback((tokens: Token[]) => {
    for (const t of tokens) {
      if (t.complete) {
        try {
          const key = `graduation_seen_${t.id}`
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, '1')
            setGraduatedToken(t)
            break
          }
        } catch {
          // ignore
        }
      }
    }
  }, [])

  const loadData = useCallback(() => {
    setTokensLoading(true)
    setTokensError(null)
    const ref = captureRef()

    fetchTokens()
      .then(({ data }) => {
        setAllTokens(data)
        setTokensLoading(false)
        checkGraduations(data)

        // Check for ?token= or ?create= in URL
        const params = new URLSearchParams(window.location.search)
        const tid = params.get('token')
        if (tid) {
          const found = data.find((x) => x.id === tid)
          if (found) setSelected(found)
        }
        if (params.get('create')) {
          setShowCreate(true)
        }
      })
      .catch((e) => {
        setTokensLoading(false)
        setTokensError(e instanceof Error ? e.message : 'Failed to load tokens')
      })

    fetchProfile(identity, ref).then((p) => {
      if (p) setProfile(p)
    })

    fetchTrades()
      .then(({ data }) => {
        if (data && data.length > 0) setTrades(data)
      })
      .catch(() => {})

    checkin(identity).then((c) => {
      if (!c || c.already) return
      const mult = c.multiplier && c.multiplier > 1 ? ` · ${c.multiplier}x XP multiplier active` : ''
      toast(`🔥 Day ${c.streak} streak! +${c.xpGained ?? 50} XP${mult}`, { duration: 5000 })
    })
  }, [identity, checkGraduations])

  useEffect(() => {
    loadData()
    const iv = setInterval(() => {
      fetchTokens().then(({ data }) => {
        setAllTokens(data)
        checkGraduations(data)
      })
      fetchTrades().then(({ data }) => {
        if (data && data.length > 0) setTrades(data)
      })
    }, 15000)
    return () => clearInterval(iv)
  }, [loadData, checkGraduations])

  const onCreated = useCallback((t: Token) => {
    setAllTokens((prev) => [t, ...prev])
    setShowCreate(false)
    setSelected(t)
  }, [])

  const handleLike = useCallback(
    async (id: string) => {
      const auth = wallet ? await signAuthChallenge(wallet) : null
      try {
        await likeToken(id, auth ?? undefined)
      } catch {
        /* silent */
      }
      setAllTokens((prev) =>
        prev.map((t) => (t.id === id ? { ...t, liked: !t.liked } : t))
      )
    },
    [wallet]
  )

  const handleComment = useCallback(
    async (text: string) => {
      if (!selected?.id) return
      const auth = wallet ? await signAuthChallenge(wallet) : null
      try {
        await postComment(selected.id, wallet ?? '', text, auth ?? undefined)
      } catch {
        /* silent */
      }
      setAllTokens((prev) =>
        prev.map((t) =>
          t.id === selected.id
            ? { ...t, comments: [...(t.comments ?? []), { wallet: identity, text, ts: Date.now() }] }
            : t
        )
      )
    },
    [selected?.id, wallet, identity]
  )

  const tokens = useMemo(() => {
    const matches = allTokens.filter((token) =>
      (token.name + token.ticker).toLowerCase().includes(search.toLowerCase())
    )
    return filterVerifiedTokens(matches, filter)
  }, [filter, search, allTokens])

  const king = useMemo(() => {
    const contenders = allTokens.filter(
      (token) => Boolean(token.onchainMint) && !token.complete && (token.realSol ?? 0) > 0
    )
    return filterVerifiedTokens(contenders, 'curve-progress')[0] ?? null
  }, [allTokens])

  return (
    <div className="min-h-screen bg-void text-white pb-24" data-testid="home-feed">
      {/* Top 3px Oracle Pulse ambient bar */}
      <div className="h-[3px] w-full iris-gradient" />

      {/* 48px Streamlined Header */}
      <TopNav
        wallet={wallet}
        onWalletChange={setWallet}
        streak={profile?.streak_days}
      />

      {/* Main Feed Container */}
      <main id="main-content" className="mx-auto max-w-7xl px-3.5 sm:px-6 pt-4 space-y-4">
        {/* Compact King of the Hill strip */}
        {king && <KOHStrip token={king} onSelect={setSelected} />}

        {/* Live dual-buffer trade ticker */}
        <LiveTicker trades={trades} />

        {/* Search & Filter pills */}
        <FilterBar
          filter={filter}
          onFilterChange={setFilter}
          search={search}
          onSearchChange={setSearch}
        />

        {/* Token Grid (2-col mobile / 3-col desktop) */}
        {tokensError ? (
          <div className="rounded-2xl border border-bleed/30 bg-bleed/10 p-8 text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <p className="text-sm font-bold text-bleed">{tokensError}</p>
            <button
              type="button"
              onClick={loadData}
              className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : tokensLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} delay={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
            {tokens.map((t) => (
              <TokenCard key={t.id} token={t} onSelect={setSelected} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {tokens.length === 0 && !tokensLoading && !tokensError && (
          <div className="rounded-2xl border border-white/10 bg-obsidian/40 p-10 text-center">
            <div className="text-5xl mb-3 animate-float-bob">🛸</div>
            <h3 className="font-display font-black text-lg text-white mb-1">
              No tokens found
            </h3>
            <p className="text-xs text-white/40 mb-4">
              Be the first degen to launch on the Oracle curve.
            </p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="rounded-xl iris-gradient px-5 py-2.5 text-xs font-display font-black text-white shadow-[0_0_20px_rgba(124,106,255,0.4)]"
            >
              Launch Token
            </button>
          </div>
        )}
      </main>

      {/* 3-Item Mobile Bottom Nav */}
      <BottomNav
        activeTab="home"
        onCreateClick={() => setShowCreate(true)}
      />

      {/* Modals */}
      {selected && (
        <TokenModal
          token={selected}
          onClose={() => setSelected(null)}
          onLike={handleLike}
          liked={Boolean(allTokens.find((t) => t.id === selected.id)?.liked)}
          comments={allTokens.find((t) => t.id === selected.id)?.comments ?? []}
          onComment={handleComment}
          wallet={wallet}
          onTradeComplete={() => {
            fetchTokens().then(({ data }) => setAllTokens(data))
          }}
        />
      )}

      {showCreate && (
        <CreateTokenModal onClose={() => setShowCreate(false)} onCreated={onCreated} />
      )}

      {graduatedToken && (
        <GraduationModal token={graduatedToken} onClose={() => setGraduatedToken(null)} />
      )}

      <WalletSelectorModal
        open={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
        onSelect={(choice) => {
          setShowWalletSelector(false)
          connectWallet(setWallet, choice)
        }}
      />
    </div>
  )
}