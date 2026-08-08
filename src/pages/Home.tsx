import { useCallback, useEffect, useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { fetchTokens, fetchQuests, fetchLeaderboard, fetchProfile, checkin, fetchReferrals } from '@/lib/api';
import { getAnonId, captureRef, shareLink } from '@/lib/identity';
import { MIGRATION_TARGET } from '@/lib/tokens';
import type { Token, Quest, Trader, Profile, ReferralStats } from '@/lib/tokens';
import { filterVerifiedTokens, formatUnixAge } from '@/lib/token-truth';
import type { VerifiedTokenFilter } from '@/lib/token-truth';
import TokenCard from '@/components/TokenCard';
import TokenModal from '@/components/TokenModal';
import WalletButton from '@/components/WalletButton';
import CreateTokenModal from '@/components/CreateTokenModal';
import Ticker from '@/components/Ticker';
import KingOfHill from '@/components/KingOfHill';
import OnboardingTour from '@/components/OnboardingTour';

type Filter = VerifiedTokenFilter;

export default function Home({ initialTab = 'tokens' }: { initialTab?: 'tokens' | 'profile' }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Token | null>(null);
  const [tab, setTab] = useState<'tokens' | 'profile'>(initialTab);
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [ranks, setRanks] = useState<Trader[]>([]);
  const [live, setLive] = useState(false);
  const [wallet, setWallet] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [refStats, setRefStats] = useState<ReferralStats | null>(null);

  const [anonId] = useState(getAnonId);
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const iv = setInterval(() => setTick(Date.now()), 60000);
    return () => clearInterval(iv);
  }, []);

  const identity = wallet ?? anonId;

  const refreshProfile = useCallback(() => {
    fetchProfile(identity).then((p) => p && setProfile(p));
    fetchQuests(identity).then(({ data }) => setQuests(data));
  }, [identity]);

  // Boot: capture referral, load tokens/quests/ranks, profile + daily check-in.
  useEffect(() => {
    const ref = captureRef();
    fetchTokens().then(({ data, live: isLive }) => {
      setAllTokens(data);
      setLive(isLive);
      const tid = new URLSearchParams(window.location.search).get('token');
      if (tid) {
        const t = data.find((x) => x.id === tid);
        if (t) setSelected(t);
      }
    });
    fetchLeaderboard().then(({ data }) => setRanks(data));
    fetchProfile(identity, ref).then((p) => {
      if (p) setProfile(p);
      if (ref) toast.success(`🏴‍☠️ Boarded via referral — your referrer just got +750 XP`);
    });
    checkin(identity).then((c) => {
      if (!c) return;
      if (c.already) return;
      const mult = c.multiplier && c.multiplier > 1 ? ` · ${c.multiplier}x XP multiplier active` : '';
      toast(`🔥 Day ${c.streak} streak! +${c.xpGained ?? 50} XP${mult}`, { duration: 5000 });
    });
    fetchQuests(identity).then(({ data }) => setQuests(data));
  }, [identity]);

  // Keep the board fresh — live numbers.
  useEffect(() => {
    const iv = setInterval(() => {
      fetchTokens().then(({ data, live: isLive }) => { setAllTokens(data); setLive(isLive); });
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  const onTokenUpdate = useCallback((t: Token) => {
    setAllTokens((prev) => prev.map((x) => (x.id === t.id ? t : x)));
    refreshProfile();
  }, [refreshProfile]);

  const onCreated = useCallback((t: Token) => {
    setAllTokens((prev) => [t, ...prev]);
    setShowCreate(false);
    setSelected(t);
    refreshProfile();
  }, [refreshProfile]);

  const tokens = useMemo(() => {
    const matches = allTokens.filter((token) =>
      (token.name + token.ticker).toLowerCase().includes(search.toLowerCase())
    );
    return filterVerifiedTokens(matches, filter);
  }, [filter, search, allTokens]);

  const king = useMemo(() => {
    const contenders = allTokens.filter((token) =>
      Boolean(token.onchainMint) && !token.complete && (token.realSol ?? 0) > 0
    );
    return filterVerifiedTokens(contenders, 'curve-progress')[0] ?? null;
  }, [allTokens]);

  const tokenNames = useMemo(
    () => Object.fromEntries(allTokens.map((t) => [t.id, `${t.emoji} $${t.ticker}`])),
    [allTokens]
  );

  const openById = useCallback((id: string) => {
    const t = allTokens.find((x) => x.id === id);
    if (t) setSelected(t);
  }, [allTokens]);

  const totalSolRaised = allTokens.reduce(
    (sum, token) => sum + (token.onchainMint ? (token.realSol ?? 0) : 0), 0,
  );

  // Referral stats load lazily when the tab opens.
  useEffect(() => {
    if (tab === 'profile') fetchReferrals(identity).then((s) => s && setRefStats(s));
  }, [tab, identity]);

  const copyRefLink = () => {
    const code = refStats?.code ?? profile?.ref_code ?? identity;
    navigator.clipboard.writeText(shareLink(code)).then(
      () => toast.success('🔗 Ref link copied — +750 XP for every degen who joins'),
      () => toast.error('Copy failed')
    );
  };

  const shareRefOnX = () => {
    const code = refStats?.code ?? profile?.ref_code ?? identity;
    const text = `🛸 Board Hermes Launchpad with my link — AI agents write the lore, the bonding curve never sleeps, and early degens stack XP.\n\n${shareLink(code)}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-white" data-vaul-drawer-wrapper="">
      <a className="skip-link" href="#main-content">Skip to token feed</a>
      <Toaster richColors position="top-center" />
      <OnboardingTour />

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-[#2a2a2a] bg-black/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2" translate="no"><span className="text-2xl" aria-hidden="true">🛸</span><span className="font-black tracking-tight">HERMES</span></div>
          <div className="flex items-center gap-3">
            {profile && <button onClick={copyRefLink} title="Copy referral link" className="hidden font-mono text-xs text-purple-300 sm:block">LVL {profile.level} · {profile.xp.toLocaleString()} XP</button>}
            <span className={`hidden font-mono text-xs md:inline ${live ? 'text-pump' : 'text-white/45'}`}>{live ? '● INDEX API REACHABLE' : '○ INDEX API UNAVAILABLE'} · indexed SOL {totalSolRaised.toFixed(1)}</span>
            <button onClick={() => setShowCreate(true)} className="hidden rounded-md bg-pump px-3 py-2 text-sm font-black text-black sm:block">Create</button>
            <WalletButton wallet={wallet} setWallet={setWallet} />
          </div>
        </div>
        <Ticker tokenNames={tokenNames} onSelect={openById} />
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden border-b border-[#2a2a2a]"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,.22),transparent_58%)]" /><div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16"><span className="font-mono text-xs uppercase tracking-[.2em] text-pump">AI-Native Fair Launches on Solana</span><h1 className="mt-3 max-w-3xl text-balance text-5xl font-black tracking-[-.06em] sm:text-7xl">Bonding curves<br /><span className="text-pump">you can verify on-chain.</span></h1><p className="mt-4 max-w-xl text-pretty text-sm leading-6 text-white/65 sm:text-base">Lore and risk from agents — not influencers. Default curve threshold: {MIGRATION_TARGET} SOL. Locked curves become migration-ready.</p><div className="mt-7 flex flex-wrap gap-2"><button onClick={() => setShowCreate(true)} className="rounded-md bg-pump px-5 py-3 font-black text-black transition-transform active:scale-[.98]">Launch Token</button><button onClick={copyRefLink} className="rounded-md border border-[#a855f7]/60 bg-[#a855f7]/10 px-5 py-3 font-bold text-purple-200">Copy Referral Link</button></div></div></header>

      {/* King of the Hill */}
      {king && (
        <section className="max-w-6xl mx-auto px-4 pb-6">
          <KingOfHill token={king} onSelect={setSelected} />
        </section>
      )}

      <aside className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/55"><span className="mr-2 rounded bg-hermes/20 px-2 py-1 font-mono text-purple-200">AI RESEARCH</span> Open any token for Bard lore & Oracle risk signals.</aside>

      <main id="main-content" className="mx-auto max-w-6xl px-3 pb-24 pt-6 sm:px-4 sm:pb-16">
        <div className="mb-5 flex items-center gap-2 border-b border-[#2a2a2a]">
          {([['tokens', 'Trade'], ['profile', 'Profile']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`border-b-2 px-3 py-3 text-sm font-black ${tab === k ? 'border-pump text-pump' : 'border-transparent text-white/50 hover:text-white'}`}>{label}</button>
          ))}
        </div>

        {tab === 'tokens' && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tokens…"
                aria-label="Search tokens"
                className="flex-1 rounded-md border border-[#2a2a2a] bg-[#111] px-4 py-2.5 text-white placeholder:text-white/30 focus:border-pump"
              />
              <div className="flex gap-2">
                {(['all', 'curve-progress', 'migration-ready'] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-md border px-3 py-2 text-sm capitalize ${filter === f ? 'border-pump bg-pump/10 text-pump' : 'border-[#2a2a2a] bg-[#111] text-white/60 hover:text-white'}`}
                  >
                    {f === 'curve-progress' ? 'Curve progress' : f === 'migration-ready' ? 'Migration ready' : 'All'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tokens.map((t) => <TokenCard key={t.id} token={t} onSelect={setSelected} />)}
            </div>
            {tokens.length === 0 && <p className="text-center text-white/40 py-10">No tokens match. The void stares back.</p>}
          </>
        )}

        {tab === 'profile' && (
          <div className="grid sm:grid-cols-2 gap-3">
            {quests.map((q) => (
              <div key={q.id} className={`rounded-xl border p-4 ${q.done ? 'border-green-400/40 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{q.done ? '✅ ' : ''}{q.title}</span>
                  <span className="text-xs px-2 py-1 rounded bg-yellow-400/10 text-yellow-300 border border-yellow-400/20">+{q.xp} XP</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full ${q.done ? 'bg-green-400' : 'bg-yellow-400'}`} style={{ width: `${Math.min(100, (q.progress / q.total) * 100)}%` }} />
                </div>
                <div className="text-xs text-white/40 mt-1">{q.progress}/{q.total} complete{q.done ? ' — paid out' : ''}</div>
              </div>
            ))}
            {quests.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-white/50 sm:col-span-2">
                No quests yet — quests launch with mainnet.
              </div>
            )}
            <div className="rounded-xl border border-purple-400/20 bg-purple-500/10 p-4 sm:col-span-2 text-sm text-purple-200">
              🔥 <b>Streak bonus:</b> check in daily — day 7 activates a <b>2x XP multiplier</b>.
              {profile ? ` You're on a ${profile.streak_days}-day streak.` : ''} Level 50 unlocks the "Legend" badge + revenue share.
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            {ranks.map((t) => (
              <div key={t.rank} className="flex items-center gap-4 px-4 py-3 border-b border-white/5 bg-white/[0.03] hover:bg-white/[0.06]">
                <span className="w-8 text-center font-black text-lg">{t.rank <= 3 ? ['🥇', '🥈', '🥉'][t.rank - 1] : t.rank}</span>
                <span className="flex-1 font-semibold">
                  {t.name}
                  {t.level ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/20">LVL {t.level}</span> : null}
                </span>
                <span className="hidden sm:block text-xs text-white/40">{t.trades} trades · {t.winRate}% win{t.streak ? ` · 🔥${t.streak}` : ''}</span>
                <span className="text-green-400 font-bold">${t.pnl.toLocaleString()}</span>
                <span className="hidden sm:block text-xs text-purple-300">{t.xp.toLocaleString()} XP</span>
              </div>
            ))}
            {ranks.length === 0 && (
              <div className="px-4 py-8 text-center text-white/40">
                Leaderboard launches with mainnet.
              </div>
            )}
          </div>
        )}
        {tab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="rounded-xl border border-purple-400/30 bg-gradient-to-b from-purple-500/15 to-transparent p-6 text-center">
              <div className="text-4xl">🏴‍☠️</div>
              <h3 className="text-2xl font-black mt-2">Recruit degens. Stack XP.</h3>
              <p className="text-sm text-white/60 mt-2 max-w-md mx-auto">
                Every degen who boards through your link pays you <b className="text-yellow-300">+{refStats?.xpPerInvite ?? 750} XP</b> instantly. No cap, no vesting — just number go up.
              </p>
              <div className="mt-5 flex gap-2">
                <input
                  readOnly
                  value={shareLink(refStats?.code ?? profile?.ref_code ?? identity)}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 rounded-lg bg-black/50 border border-white/10 px-3 py-2.5 text-xs text-purple-200 font-mono outline-none"
                />
                <button onClick={copyRefLink} className="px-5 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-bold">Copy</button>
              </div>
              <button onClick={shareRefOnX} className="mt-2 w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-semibold">
                📣 Post your link on X
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-black text-white">{refStats?.invites ?? 0}</div>
                <div className="text-[10px] uppercase tracking-wide text-white/40 mt-1">Recruits</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-black text-yellow-300">{(refStats?.xpEarned ?? 0).toLocaleString()}</div>
                <div className="text-[10px] uppercase tracking-wide text-white/40 mt-1">XP earned</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-black text-purple-300">+{refStats?.xpPerInvite ?? 750}</div>
                <div className="text-[10px] uppercase tracking-wide text-white/40 mt-1">XP per recruit</div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs font-semibold text-white/60 mb-2">🧑🚀 Your recruits</div>
              {refStats && refStats.referred.length > 0 ? (
                <div className="space-y-1.5">
                  {refStats.referred.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b border-white/5 pb-1.5">
                      <span className="font-mono text-purple-300">{r.name}</span>
                      <span className="text-xs text-white/40">{formatUnixAge(r.ts, tick)}</span>
                      <span className="text-xs text-yellow-300 font-semibold">+{refStats.xpPerInvite} XP</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/35">No recruits yet — your link is loaded. Degens who land on it and check in count instantly.</p>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/45 space-y-1">
              <div><b className="text-white/70">How it works:</b></div>
              <div>1. Copy your link — it carries your personal ref code.</div>
              <div>2. Drop it in group chats, X, wherever degens congregate.</div>
              <div>3. They land, a profile is created, <b className="text-yellow-300">+750 XP</b> hits your account instantly.</div>
            </div>
          </div>
        )}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[#2a2a2a] bg-black/95 px-4 pb-[env(safe-area-inset-bottom)] sm:hidden" aria-label="Mobile navigation"><button onClick={() => setTab('tokens')} className={`flex-1 py-3 text-sm font-black ${tab === 'tokens' ? 'text-pump' : 'text-white/45'}`}>Trade</button><button onClick={() => setShowCreate(true)} className="-mt-4 rounded-full bg-pump px-5 py-3 text-sm font-black text-black shadow-lg">Create</button><button onClick={() => setTab('profile')} className={`flex-1 py-3 text-sm font-black ${tab === 'profile' ? 'text-pump' : 'text-white/45'}`}>Profile</button></nav>

      <footer className="border-t border-[#2a2a2a] px-4 py-8 text-center text-xs text-white/40">
        <p>🤖 Hermes Launchpad — AI-native fair launches on Solana. Bonding curves you can verify on-chain. Lore and risk from agents — not influencers.</p>
        <p className="mt-1">Devnet demo / experimental. Not financial advice. Always do your own research. Platform fees: 0.25% platform · 0.25% creator.</p>
      </footer>

      {selected && (
        <TokenModal
          token={selected}
          identity={identity}
          profile={profile}
          onClose={() => { setSelected(null); refreshProfile(); }}
          onTokenUpdate={onTokenUpdate}
        />
      )}
      {showCreate && (
        <CreateTokenModal
          onClose={() => setShowCreate(false)}
          onCreated={onCreated}
        />
      )}
    </div>
  );
}