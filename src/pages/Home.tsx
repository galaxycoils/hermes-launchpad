import { useEffect, useMemo, useState } from 'react';
import { TOKENS, QUESTS, LEADERBOARD, fmtUsd } from '@/lib/tokens';
import { fetchTokens, fetchQuests, fetchLeaderboard } from '@/lib/api';
import type { Token, Quest, Trader } from '@/lib/tokens';
import TokenCard from '@/components/TokenCard';
import TokenModal from '@/components/TokenModal';
import WalletButton from '@/components/WalletButton';
import CreateTokenModal from '@/components/CreateTokenModal';
import type { PublicKey } from '@solana/web3.js';

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
  const [tab, setTab] = useState<'tokens' | 'quests' | 'ranks'>('tokens');
  const [allTokens, setAllTokens] = useState<Token[]>(TOKENS);
  const [quests, setQuests] = useState<Quest[]>(QUESTS);
  const [ranks, setRanks] = useState<Trader[]>(LEADERBOARD);
  const [live, setLive] = useState(false);
  const [wallet, setWallet] = useState<PublicKey | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchTokens().then(({ data, live }) => { setAllTokens(data); setLive(live); });
    fetchQuests().then(({ data }) => setQuests(data));
    fetchLeaderboard().then(({ data }) => setRanks(data));
  }, []);

  const tokens = useMemo(() => {
    let list = allTokens.filter((t) =>
      (t.name + t.ticker).toLowerCase().includes(search.toLowerCase())
    );
    if (filter === 'trending') list = [...list].sort((a, b) => b.volume24h - a.volume24h);
    if (filter === 'new') list = [...list].sort((a, b) => a.createdMinsAgo - b.createdMinsAgo);
    if (filter === 'migrating') list = [...list].sort((a, b) => b.curveProgress - a.curveProgress);
    return list;
  }, [filter, search]);

  const totalVol = allTokens.reduce((s, t) => s + t.volume24h, 0);

  return (
    <div className="min-h-screen bg-[#0a0a10] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a10]/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛸</span>
            <span className="font-black tracking-tight">HERMES<span className="text-green-400">LAUNCHPAD</span></span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`hidden sm:inline text-xs px-2 py-1 rounded-full border ${live ? 'bg-green-400/10 text-green-300 border-green-400/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
              {live ? '● LIVE API' : '○ demo data'} · 24h vol {fmtUsd(totalVol)}
            </span>
            <WalletButton wallet={wallet} setWallet={setWallet} />
          </div>
        </div>
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
          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={() => setShowCreate(true)} className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold">+ Create Token ($0.50)</button>
            <a href="#explore" className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-semibold">Explore Tokens ↓</a>
          </div>
        </div>
      </header>

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
          {([['tokens', '🪙 Tokens'], ['quests', '⚡ Quests'], ['ranks', '🏆 Leaderboard']] as const).map(([k, label]) => (
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
              <div key={q.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{q.title}</span>
                  <span className="text-xs px-2 py-1 rounded bg-yellow-400/10 text-yellow-300 border border-yellow-400/20">+{q.xp} XP</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(q.progress / q.total) * 100}%` }} />
                </div>
                <div className="text-xs text-white/40 mt-1">{q.progress}/{q.total} complete</div>
              </div>
            ))}
            <div className="rounded-xl border border-purple-400/20 bg-purple-500/10 p-4 sm:col-span-2 text-sm text-purple-200">
              🔥 <b>Streak bonus:</b> trade 7 days in a row → 2x XP tomorrow. Level 50 unlocks "Legend" badge + revenue share.
            </div>
          </div>
        )}

        {tab === 'ranks' && (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            {ranks.map((t) => (
              <div key={t.rank} className="flex items-center gap-4 px-4 py-3 border-b border-white/5 bg-white/[0.03] hover:bg-white/[0.06]">
                <span className="w-8 text-center font-black text-lg">{t.rank <= 3 ? ['🥇', '🥈', '🥉'][t.rank - 1] : t.rank}</span>
                <span className="flex-1 font-semibold">{t.name}</span>
                <span className="hidden sm:block text-xs text-white/40">{t.trades} trades · {t.winRate}% win</span>
                <span className="text-green-400 font-bold">{fmtUsd(t.pnl)}</span>
                <span className="hidden sm:block text-xs text-purple-300">{t.xp.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/40 px-4">
        <p>🛸 Hermes Launchpad — demo frontend. Tokens, prices & agents are mock data; no real funds involved.</p>
        <p className="mt-1">Nothing here is financial advice. DYOR. Fees: 0.25% platform · 0.25% creator · 0.1% referral · 0.1% burn.</p>
      </footer>

      {selected && <TokenModal token={selected} wallet={wallet} onClose={() => setSelected(null)} />}
      {showCreate && <CreateTokenModal wallet={wallet} onClose={() => setShowCreate(false)} />}
    </div>
  );
}
