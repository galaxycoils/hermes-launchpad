import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { fmtUsd, MIGRATION_TARGET } from '@/lib/tokens';
import type { Token, CommentItem, Profile } from '@/lib/tokens';
import {
  postTrade, fetchComments, postComment, likeToken, genLore, genRisk,
} from '@/lib/api';
import { shareLink } from '@/lib/identity';
import Sparkline from './Sparkline';

interface Props {
  token: Token;
  identity: string;
  profile: Profile | null;
  onClose: () => void;
  onTokenUpdate: (t: Token) => void;
}

const short = (w: string) => (w.length > 12 ? `${w.slice(0, 4)}…${w.slice(-4)}` : w);
const ago = (ts: number) => {
  const m = Math.max(1, Math.floor((Date.now() / 1000 - ts) / 60));
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h`;
};

export default function TokenModal({ token: initial, identity, profile, onClose, onTokenUpdate }: Props) {
  const [token, setToken] = useState<Token>(initial);
  const [amount, setAmount] = useState('');
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [busy, setBusy] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [aiBusy, setAiBusy] = useState<'lore' | 'risk' | null>(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetchComments(token.id).then(setComments).catch(() => {});
  }, [token.id]);

  const update = (t: Token) => { setToken(t); onTokenUpdate(t); };

  const xpToast = (xpGained?: number, quest?: { title: string; xp: number } | null) => {
    if (quest) toast.success(`⚡ Quest complete: ${quest.title} (+${quest.xp} XP)`);
    else if (xpGained) toast.success(`+${xpGained} XP`);
  };

  const trade = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || busy) return;
    setBusy(true);
    try {
      const r = await postTrade({ token_id: token.id, wallet: identity, side: tab, amount: amt });
      update(r.token);
      setAmount('');
      if (r.graduated) {
        confetti({ particleCount: 300, spread: 120, origin: { y: 0.6 } });
        toast.success(`🎓 ${token.ticker} GRADUATED! Liquidity migrates to Raydium — LP burned forever.`);
      } else if (tab === 'buy') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors: ['#22c55e', '#a855f7', '#facc15'] });
        toast.success(`Bought ${r.tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${token.ticker} for ${r.solAmount.toFixed(3)} SOL`);
      } else {
        toast.success(`Sold for ${r.solAmount.toFixed(3)} SOL · PnL ${r.pnl >= 0 ? '+' : ''}$${r.pnl.toFixed(2)}`);
      }
      xpToast(r.xpGained, r.questCompleted);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Trade failed');
    }
    setBusy(false);
  };

  const sendComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    try {
      const r = await postComment(token.id, identity, text);
      setCommentText('');
      setComments(await fetchComments(token.id));
      setToken({ ...token, replies: token.replies + 1 });
      xpToast(r.xpGained, r.questCompleted);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Comment failed');
    }
  };

  const like = async () => {
    try {
      const r = await likeToken(token.id, identity);
      if (r.liked) {
        setLiked(true);
        setToken({ ...token, likes: (token.likes ?? 0) + 1 });
        xpToast(r.xpGained, r.questCompleted);
      }
    } catch { /* noop */ }
  };

  const callBard = async () => {
    setAiBusy('lore');
    try {
      const r = await genLore(token.id);
      setToken({ ...token, lore: r.lore });
      toast.success('📜 The Bard wrote fresh lore');
    } catch { toast.error('The Bard is asleep (AI busy) — try again'); }
    setAiBusy(null);
  };

  const callOracle = async () => {
    setAiBusy('risk');
    try {
      const r = await genRisk(token.id);
      setToken({ ...token, riskScore: r.score });
      toast.success(`🔮 The Oracle: ${r.score}/100 — ${r.flag}`);
    } catch { toast.error('The Oracle is meditating — try again'); }
    setAiBusy(null);
  };

  const share = () => {
    const link = shareLink(profile?.ref_code || identity, token.id);
    const text = `🛸 $${token.ticker} — ${token.name}\n\n"${token.lore}"\n\n${token.curveProgress}% to Raydium graduation on Hermes Launchpad. The Bard writes the lore, the curve never sleeps.\n\n${link}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const est = amount && tab === 'buy'
    ? (parseFloat(amount) / (token.priceSol || 1e-8)).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : amount ? `${(parseFloat(amount) * (token.priceSol || 0)).toFixed(4)} SOL` : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#12121a] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{token.emoji}</span>
            <div>
              <h2 className="text-xl font-bold text-white">
                {token.name} <span className="text-white/50 text-sm">${token.ticker}</span>
                {token.complete && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">🎓 GRADUATED</span>}
              </h2>
              <div className="text-xs text-white/50">{token.chain} · created by {token.creator}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-white/40">Price</div>
              <div className="text-lg font-bold text-white">${token.price.toFixed(8)}</div>
            </div>
            <Sparkline data={token.spark} positive={token.change24h >= 0} w={200} h={56} />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3 text-center text-sm">
            <div><div className="text-[10px] text-white/40">MCAP</div><div className="font-semibold text-white">{fmtUsd(token.marketCap)}</div></div>
            <div><div className="text-[10px] text-white/40">VOL 24H</div><div className="font-semibold text-white">{fmtUsd(token.volume24h)}</div></div>
            <div><div className="text-[10px] text-white/40">HOLDERS</div><div className="font-semibold text-white">{token.holders.toLocaleString()}</div></div>
            <div>
              <div className="text-[10px] text-white/40">AI RISK <button onClick={callOracle} className="text-purple-300 hover:underline">{aiBusy === 'risk' ? '…' : '↻'}</button></div>
              <div className={`font-semibold ${token.riskScore < 40 ? 'text-green-400' : token.riskScore < 65 ? 'text-yellow-400' : 'text-red-400'}`}>{token.riskScore}/100</div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-purple-500/10 border border-purple-400/20 p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-semibold text-purple-300">📜 The Bard — AI lore</div>
            <button onClick={callBard} disabled={aiBusy !== null} className="text-[11px] px-2 py-1 rounded bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 disabled:opacity-50">
              {aiBusy === 'lore' ? 'Writing…' : '✍️ New lore'}
            </button>
          </div>
          <p className="text-sm text-white/80 italic">"{token.lore}"</p>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>Graduation progress</span>
            <span>{(token.realSol ?? 0).toFixed(1)} / 85 SOL</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 via-green-400 to-emerald-300 transition-all" style={{ width: `${token.curveProgress}%` }} />
          </div>
          <p className="text-[11px] text-white/40 mt-1">At {fmtUsd(MIGRATION_TARGET)} market cap, liquidity auto-migrates to Raydium and LP is burned forever.</p>
        </div>

        {!token.complete && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(['buy', 'sell'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`py-2 rounded-lg font-bold capitalize ${tab === t ? (t === 'buy' ? 'bg-green-500 text-black' : 'bg-red-500 text-white') : 'bg-white/10 text-white/60'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {(tab === 'buy' ? [0.1, 0.5, 1, 5] : [10000, 100000, 1000000, 10000000]).map((v) => (
                <button key={v} onClick={() => setAmount(String(v))} className="flex-1 text-xs py-1.5 rounded bg-white/10 text-white/70 hover:bg-white/20">
                  {tab === 'buy' ? `${v} SOL` : `${v >= 1e6 ? `${v / 1e6}M` : `${v / 1e3}K`} tok`}
                </button>
              ))}
            </div>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder={tab === 'buy' ? 'Amount in SOL' : 'Amount in tokens'}
              className="mt-2 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-green-400/50"
            />
            <div className="flex justify-between text-xs text-white/50 mt-2">
              <span>{tab === 'buy' ? `You receive ≈ ${est} ${token.ticker}` : `You receive ≈ ${est}`}</span>
              <span>Fees: 0.7%</span>
            </div>
            <button
              onClick={trade}
              disabled={busy || !amount}
              className={`mt-3 w-full py-3 rounded-xl font-bold text-lg disabled:opacity-40 ${tab === 'buy' ? 'bg-green-500 hover:bg-green-400 text-black' : 'bg-red-500 hover:bg-red-400 text-white'}`}
            >
              {busy ? 'Executing on the curve…' : tab === 'buy' ? `Buy ${token.ticker}` : `Sell ${token.ticker}`}
            </button>
            <p className="text-center text-[10px] text-white/30 mt-2">
              Shared devnet curve engine — every trade moves the real price for everyone. On-chain program plugs in at deployment.
            </p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button onClick={like} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${liked ? 'bg-red-500/20 text-red-300 border border-red-400/30' : 'bg-white/10 text-white/70 hover:bg-white/15'}`}>
            {liked ? '❤️' : '🤍'} {(token.likes ?? 0).toLocaleString()}
          </button>
          <button onClick={share} className="flex-1 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/15 text-sm font-semibold">
            📣 Share on X
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(shareLink(profile?.ref_code || identity, token.id)); toast.success('Referral link copied — earn 750 XP per signup'); }}
            className="flex-1 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/15 text-sm font-semibold"
          >
            🔗 Copy ref link
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-semibold text-white/60 mb-2">💬 {token.replies.toLocaleString()} replies</div>
          <div className="max-h-44 overflow-y-auto space-y-2">
            {comments.map((c, i) => (
              <div key={i} className="text-sm">
                <span className="text-purple-300 font-mono text-xs">{short(c.wallet)}</span>
                <span className="text-white/40 text-xs ml-2">{ago(c.ts)}</span>
                <div className="text-white/80">{c.text}</div>
              </div>
            ))}
            {comments.length === 0 && <p className="text-white/30 text-xs">No replies yet — be the first degen.</p>}
          </div>
          <div className="flex gap-2 mt-3">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendComment()}
              maxLength={280}
              placeholder="Drop alpha (or cope)…"
              className="flex-1 rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-400/50"
            />
            <button onClick={sendComment} className="px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-bold">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
