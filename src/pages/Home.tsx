import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { TOKENS, QUESTS, LEADERBOARD, fmtUsd, fmtAgo } from '@/lib/tokens';
import { fetchTokens, fetchQuests, fetchLeaderboard, fetchProfile, checkin, fetchReferrals } from '@/lib/api';
import { getAnonId, captureRef, shareLink } from '@/lib/identity';
import type { Token, Quest, Trader, Profile, ReferralStats } from '@/lib/tokens';
import TokenCard from '@/components/TokenCard';
import TokenModal from '@/components/TokenModal';
import WalletButton from '@/components/WalletButton';
import CreateTokenModal from '@/components/CreateTokenModal';
import Ticker from '@/components/Ticker';
import KingOfHill from '@/components/KingOfHill';

type Filter = 'all' | 'trending' | 'new' | 'migrating';

const AGENTS = [
  { name: 'The Bard', role: 'Narrative Agent', desc: 'Generates token lore & tweet threads', icon: '📜' },
  { name: 'The Oracle', role: 'Analyst Agent', desc: 'On-chain risk scores & red flags', icon: '🔮' },
  { name: 'The Warden', role: 'Moderator Agent', desc: 'Scam, spam & safety filtering', icon: '🛡️' },
  { name: 'The Weaver', role: 'Sentiment Agent', desc: 'Twitter/Telegram/on-chain mood', icon: '🕸️' },
];

export default function Home() {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Token | null>(null);
  const [tab, setTab] = useState<'tokens' | 'quests' | 'ranks' | 'refs'>('tokens');
  const [allTokens, setAllTokens] = useState<Token[]>(TOKENS);
  const [quests, setQuests] = useState<Quest[]>(QUESTS);
  const [ranks, setRanks] = useState<Trader[]>(LEADERBOARD);
  const [live, setLive] = useState(false);
  const [wallet, setWallet] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [refStats, setRefStats] = useState<ReferralStats | null>(null);

  const anonId = useRef(getAnonId()).current;
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
      // deep link ?token=<id>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity]);

  // Keep the board fresh — FOMO needs live numbers.
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
    let list = allTokens.filter((t) =>
      (t.name + t.ticker).toLowerCase().includes(search.toLowerCase())
    );
    if (filter === 'trending') list = [...list].sort((a, b) => b.volume24h - a.volume24h);
    if (filter === 'new') list = [...list].sort((a, b) => a.createdMinsAgo - b.createdMinsAgo);
    if (filter === 'migrating') list = [...list].sort((a, b) => b.curveProgress - a.curveProgress);
    return list;
  }, [filter, search, allTokens]);

  const king = useMemo(() => {
    const contenders = allTokens.filter((t) => !t.complete && t.curveProgress > 0);
    return contenders.sort((a, b) => b.curveProgress - a.curveProgress)[0] ?? null;
  }, [allTokens]);

  const tokenNames = useMemo(
    () => Object.fromEntries(allTokens.map((t) => [t.id, `${t.emoji} $${t.ticker}`])),
    [allTokens]
  );

  const openById = useCallback((id: string) => {
    const t = allTokens.find((x) => x.id === id);
    if (t) setSelected(t);
  }, [allTokens]);

  const totalVol = allTokens.reduce((s, t) => s + t.volume24h, 0);

  // Referral stats load lazily when the tab opens.
  useEffect(() => {
    if (tab === 'refs') fetchReferrals(identity).then((s) => s && setRefStats(s));
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
    <div className="min-h-screen bg-[#0a0a10] text-white">
      <Toaster richColors position="top-center" />

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a10]/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛸</span>
            <span className="font-black tracking-tight">HERMES<span className="text-green-400">LAUNCHPAD</span></span>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <button
                onClick={copyRefLink}
                title="Copy your referral link"
                className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-purple-400/30 bg-purple-500/10 hover:bg-purple-500/20"
              >
                <span className="font-black text-purple-300">LVL {profile.level}</span>
                <span className="text-white/60">{profile.xp.toLocaleString()} XP</span>
                {profile.streak_days > 0 && <span className="text-orange-400">🔥{profile.streak_days}</span>}
              </button>
            )}
            <span className={`hidden md:inline text-xs px-2 py-1 rounded-full border ${live ? 'bg-green-400/10 text-green-300 border-green-400/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
              {live ? '● LIVE' : '○ demo'} · 24h {fmtUsd(totalVol)}
            </span>
            <WalletButton wallet={wallet} setWallet={setWallet} />
          </div>
        </div>
        <Ticker tokenNames={tokenNames} onSelect={openById} />
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.15),_transparent_60%)]" />
        <div className="max-w-6xl mx-auto px-4 py-14 relative text-center">
          <div className="inline-block text-xs px-3 py-1 rounded-full border border-purple-400/30 bg-purple-500/10 text-purple-300 mb-4">
            AI-Native · Multi-Chain · 0.7% fees — 75% cheaper than pump.fun
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Launch a coin.<br />
            <span className="bg-gradient-to-r from-purple-400 via-green-400 to-emerald-300 bg-clip-text text-transparent">Defy gravity.</span>
          </h1>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            Fair-launch bonding curves with AI agents writing the lore, scoring the risk, and guarding the vibes. Migrate to Raydium at {fmtUsd(69420)} — LP burned forever.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => setShowCreate(true)} className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold">+ Create Token · earn 1,000 XP</button>
            <button onClick={copyRefLink} className="px-6 py-3 rounded-xl border border-purple-400/40 bg-purple-500/10 hover:bg-purple-500/20 font-semibold text-purple-200">🔗 Invite · +750 XP</button>
          </div>
        </div>
      </header>

      {/* King of the Hill */}
      {king && (
        <section className="max-w-6xl mx-auto px-4 pb-6">
          <KingOfHill token={king} onSelect={setSelected} />
        </section>
      )}

      {/* AI Agents strip */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {AGENTS.map((a) => (
            <div key={a.name} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-2xl">{a.icon}</div>
              <div className="font-bold mt-1">{a.name}</div>
              <div className="text-[11px] text-purple-300">{a.role}</div>
              <div className="text-xs text-white/50 mt-1">{a.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Main tabs */}
      <main id="explore" className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center gap-2 mb-4">
          {([['tokens', '🪙 Tokens'], ['quests', '⚡ Quests'], ['ranks', '🏆 Leaderboard'], ['refs', '🔗 Referrals']] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === k ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/15'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'tokens' && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tokens..."
                className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-green-400/50"
              />
              <div className="flex gap-2">
                {(['all', 'trending', 'new', 'migrating'] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 rounded-lg text-sm capitalize ${filter === f ? 'bg-green-500/20 text-green-300 border border-green-400/40' : 'bg-white/5 text-white/50 border border-white/10'}`}
                  >
                    {f === 'migrating' ? '🚀 migrating' : f}
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

        {tab === 'quests' && (
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
            <div className="rounded-xl border border-purple-400/20 bg-purple-500/10 p-4 sm:col-span-2 text-sm text-purple-200">
              🔥 <b>Streak bonus:</b> check in daily — day 7 activates a <b>2x XP multiplier</b>.
              {profile ? ` You're on a ${profile.streak_days}-day streak.` : ''} Level 50 unlocks the "Legend" badge + revenue share.
            </div>
          </div>
        )}

        {tab === 'ranks' && (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            {ranks.map((t) => (
              <div key={t.rank} className="flex items-center gap-4 px-4 py-3 border-b border-white/5 bg-white/[0.03] hover:bg-white/[0.06]">
                <span className="w-8 text-center font-black text-lg">{t.rank <= 3 ? ['🥇', '🥈', '🥉'][t.rank - 1] : t.rank}</span>
                <span className="flex-1 font-semibold">
                  {t.name}
                  {t.level ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/20">LVL {t.level}</span> : null}
                </span>
                <span className="hidden sm:block text-xs text-white/40">{t.trades} trades · {t.winRate}% win{t.streak ? ` · 🔥${t.streak}` : ''}</span>
                <span className="text-green-400 font-bold">{fmtUsd(t.pnl)}</span>
                <span className="hidden sm:block text-xs text-purple-300">{t.xp.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        )}
        {tab === 'refs' && (
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
              <div className="text-xs font-semibold text-white/60 mb-2">🧑‍🚀 Your recruits</div>
              {refStats && refStats.referred.length > 0 ? (
                <div className="space-y-1.5">
                  {refStats.referred.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b border-white/5 pb-1.5">
                      <span className="font-mono text-purple-300">{r.name}</span>
                      <span className="text-xs text-white/40">{fmtAgo(Math.max(1, Math.floor((Date.now() / 1000 - r.ts) / 60)))}</span>
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
              <div>2. Drop it in group chats, X, anywhere degens congregate.</div>
              <div>3. They land, a profile is created, <b className="text-yellow-300">+750 XP</b> hits your account immediately.</div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/40 px-4">
        <p>🛸 Hermes Launchpad — {live ? 'live curve engine: every trade moves the real shared price (Cloudflare Worker + D1).' : 'showing built-in demo data.'} Devnet-grade demo — no real funds involved.</p>
        <p className="mt-1">Nothing here is financial advice. DYOR. Fees: 0.25% platform · 0.25% creator · 0.1% referral · 0.1% burn.</p>
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
          identity={identity}
          onClose={() => setShowCreate(false)}
          onCreated={onCreated}
        />
      )}
    </div>
  );
}
