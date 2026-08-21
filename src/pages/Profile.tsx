import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'
import TraderProfile from '@/components/TraderProfile'
import AchievementBadges from '@/components/AchievementBadges'
import StreakCounter from '@/components/StreakCounter'
import QuestCard from '@/components/QuestCard'
import SocialFeed from '@/components/SocialFeed'
import WalletSelectorModal from '@/components/WalletSelectorModal'
import { connectWallet, isMobile, useWalletProvider } from '@/lib/wallet'
import { getAnonId, captureRef, shareLink } from '@/lib/identity'
import { fetchLeaderboard, fetchProfile, fetchQuests, fetchReferrals } from '@/lib/api'
import type { Quest, Trader, Profile as ProfileType, ReferralStats } from '@/lib/tokens'

export default function Profile() {
  const { connecting: walletConnecting, providerDetected: walletDetected, retry: walletRetry } = useWalletProvider()

  const [wallet, setWallet] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [quests, setQuests] = useState<Quest[]>([])
  const [ranks, setRanks] = useState<Trader[]>([])
  const [refStats, setRefStats] = useState<ReferralStats | null>(null)
  const [showWalletSelector, setShowWalletSelector] = useState(false)

  const [anonId] = useState(getAnonId)
  const identity = wallet ?? anonId

  useEffect(() => {
    if (walletDetected) {
      connectWallet(setWallet)
    }
  }, [walletDetected])

  const refreshProfileData = useCallback(() => {
    const ref = captureRef()
    fetchProfile(identity, ref).then((p) => p && setProfile(p))
    fetchQuests(identity).then(({ data }) => setQuests(data))
    fetchLeaderboard().then(({ data }) => setRanks(data))
    fetchReferrals(identity).then((s) => setRefStats(s))
  }, [identity])

  useEffect(() => {
    refreshProfileData()
  }, [refreshProfileData])

  const copyRefLink = () => {
    const code = refStats?.code ?? profile?.ref_code ?? identity
    navigator.clipboard.writeText(shareLink(code)).then(
      () => toast.success('🔗 Referral link copied — +750 XP for every degen who joins'),
      () => toast.error('Copy failed')
    )
  }

  const shareRefOnX = () => {
    const code = refStats?.code ?? profile?.ref_code ?? identity
    const text = `🛸 Board Hermes Launchpad — AI oracle trading on Solana bonding curves.\n\n${shareLink(code)}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-void text-white pb-24" data-testid="profile-page">
      {/* Top 3px Oracle Pulse ambient bar */}
      <div className="h-[3px] w-full iris-gradient" />

      <TopNav
        wallet={wallet}
        onWalletChange={setWallet}
        streak={profile?.streak_days}
        refCode={refStats?.code ?? profile?.ref_code ?? identity}
      />

      <main id="main-content" className="mx-auto max-w-4xl px-4 pt-6 space-y-5">
        {/* Header Title */}
        <div className="flex items-center justify-between">
          <h1 className="font-display font-black text-2xl text-white">Trader Profile & Quests</h1>
          <span className="font-mono text-xs text-iris-start bg-iris/10 border border-iris/30 px-2.5 py-1 rounded-full">
            Devnet Beta
          </span>
        </div>

        {/* Wallet Management Card */}
        <div className="rounded-2xl border border-white/10 bg-obsidian/70 p-5 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">Connected Wallet</div>
              <div className="mt-0.5 font-mono text-sm font-bold text-white">
                {wallet ? `${wallet.slice(0, 8)}…${wallet.slice(-8)}` : `Guest (Anonymous: ${anonId.slice(0, 6)}…)`}
              </div>
            </div>

            {wallet ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(wallet)
                    toast.success('Wallet address copied')
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-white/80 hover:bg-white/10 transition-colors"
                >
                  Copy Address
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWallet(null)
                    toast.info('Wallet disconnected')
                  }}
                  className="rounded-xl border border-bleed/30 bg-bleed/10 px-3.5 py-2 text-xs font-bold text-bleed hover:bg-bleed/20 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : walletConnecting ? (
              <button
                type="button"
                onClick={() => walletRetry()}
                className="rounded-xl bg-sol/10 border border-sol/30 px-3.5 py-2 text-xs font-bold text-sol"
              >
                Connecting… Retry
              </button>
            ) : isMobile() ? (
              <button
                type="button"
                onClick={() => setShowWalletSelector(true)}
                className="rounded-xl bg-iris px-4 py-2 text-xs font-display font-black text-white hover:bg-iris/90 shadow-[0_0_15px_rgba(124,106,255,0.3)] transition-all active:scale-[0.98]"
              >
                Connect Wallet
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await connectWallet(setWallet)
                    toast.success('Wallet connected!')
                  } catch {
                    // cancelled
                  }
                }}
                className="rounded-xl bg-iris px-4 py-2 text-xs font-display font-black text-white hover:bg-iris/90 shadow-[0_0_15px_rgba(124,106,255,0.3)] transition-all active:scale-[0.98]"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Level + XP Trader Profile */}
        <TraderProfile wallet={wallet ?? ''} />

        {/* Badges and Streak */}
        <div className="grid gap-4 md:grid-cols-2">
          <AchievementBadges
            profile={
              profile ?? {
                wallet: '',
                xp: 0,
                level: 0,
                streak_days: 0,
                ref_code: '',
                trades: 0,
                pnl: 0,
                achievements: [],
              }
            }
          />
          <StreakCounter streak={Number(profile?.streak_days ?? 0)} />
        </div>

        {/* Daily Quests */}
        <div className="rounded-2xl border border-white/10 bg-obsidian/70 p-5 backdrop-blur-md">
          <h2 className="mb-3.5 text-xs font-display font-bold uppercase tracking-wider text-white/50">
            ⚔️ Daily Quests
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {quests.map((q) => (
              <QuestCard key={q.id} quest={q} onClaim={() => {}} />
            ))}
            {quests.length === 0 && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center sm:col-span-2">
                <p className="text-white/40 text-xs font-mono">No active quests available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        {ranks.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-obsidian/70 p-5 backdrop-blur-md">
            <h2 className="mb-3.5 text-xs font-display font-bold uppercase tracking-wider text-white/50">
              🏆 Top Degen Leaderboard
            </h2>
            <div className="space-y-1.5 overflow-hidden rounded-xl">
              {ranks.map((t) => (
                <div
                  key={t.rank}
                  className="flex items-center gap-3 px-4 py-3 border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] rounded-xl transition-colors text-xs"
                >
                  <span className="w-6 text-center font-display font-black text-base">
                    {t.rank <= 3 ? ['🥇', '🥈', '🥉'][t.rank - 1] : t.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="truncate font-semibold text-white">{t.name}</span>
                    {t.level ? (
                      <span className="ml-2 rounded bg-iris/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-iris-start border border-iris/30">
                        LVL {t.level}
                      </span>
                    ) : null}
                  </div>
                  <span className="hidden sm:block font-mono text-white/40">
                    {t.trades} trades · {t.winRate}% win
                  </span>
                  <span className="font-mono text-pulse font-bold">${t.pnl.toFixed(2)}</span>
                  <span className="font-mono text-sol">{t.xp.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recruit / Referral Section */}
        <div className="rounded-2xl border border-sol/20 bg-gradient-to-br from-sol/[0.06] via-obsidian to-void p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-display font-bold uppercase tracking-wider text-sol">
              🏴‍☠️ Recruit Degens (+750 XP)
            </h2>
          </div>

          <div className="mb-4 text-center">
            <h3 className="text-lg font-display font-black text-white">Stack XP. Recruit Degens.</h3>
            <p className="mt-1.5 text-xs text-white/60 max-w-md mx-auto">
              Every degen who boards through your referral link pays you{' '}
              <b className="text-sol">+{refStats?.xpPerInvite ?? 750} XP</b> instantly.
            </p>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              readOnly
              value={shareLink(refStats?.code ?? profile?.ref_code ?? identity)}
              onFocus={(e) => e.target.select()}
              aria-label="Referral link"
              className="flex-1 rounded-xl bg-black/50 border border-white/10 px-3.5 py-2.5 text-xs font-mono text-iris-start outline-none focus:border-iris"
            />
            <button
              type="button"
              onClick={copyRefLink}
              className="rounded-xl bg-iris px-4 py-2 text-xs font-display font-black text-white hover:bg-iris/90 transition-colors"
            >
              Copy
            </button>
          </div>

          <button
            type="button"
            onClick={shareRefOnX}
            className="w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 text-xs font-semibold text-white/80 transition-colors"
          >
            📣 Post link on X
          </button>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2.5 text-center mt-4">
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <div className="text-xl font-bold font-mono text-white">{refStats?.invites ?? 0}</div>
              <div className="text-[10px] uppercase text-white/40 mt-0.5">Recruits</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <div className="text-xl font-bold font-mono text-sol">
                {(refStats?.xpEarned ?? 0).toLocaleString()}
              </div>
              <div className="text-[10px] uppercase text-white/40 mt-0.5">XP earned</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <div className="text-xl font-bold font-mono text-iris-start">
                +{refStats?.xpPerInvite ?? 750}
              </div>
              <div className="text-[10px] uppercase text-white/40 mt-0.5">XP / recruit</div>
            </div>
          </div>
        </div>

        {/* Social Activity Feed */}
        <SocialFeed wallet={wallet} />
      </main>

      {/* Bottom Nav */}
      <BottomNav activeTab="profile" onTabChange={() => {}} unreadCount={0} />

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
