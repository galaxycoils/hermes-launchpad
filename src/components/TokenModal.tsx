import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { PublicKey, Transaction } from '@solana/web3.js';
import { MIGRATION_TARGET } from '@/lib/tokens';
import type { Token, CommentItem, Profile } from '@/lib/tokens';
import { migrationProgress } from '@/lib/token-truth';
import {
  fetchComments, postComment, likeToken, genLore, genRisk, fetchToken,
  indexTrade
} from '@/lib/api';
import { shareLink } from '@/lib/identity';
import { getProvider, buildTradeIx, sendTx, fetchCurveState, computeBuyQuote, computeSellQuote, ensureAtaIx, solToLamports } from '@/lib/solana';

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
  const [showResearch, setShowResearch] = useState(false);

  useEffect(() => {
    fetchComments(token.id).then(setComments).catch(() => {});
    // Fresh server state: persisted like status + The Oracle's verdict.
    fetchToken(token.id, identity).then((fresh) => {
      if (!fresh) return;
      setLiked(Boolean(fresh.likedByMe));
      setToken((prev) => ({ ...prev, riskFlag: fresh.riskFlag, lore: fresh.lore }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token.id]);

  const update = (t: Token) => { setToken(t); onTokenUpdate(t); };

  const xpToast = (xpGained?: number, quest?: { title: string; xp: number } | null) => {
    if (quest) toast.success(`⚡ Quest complete: ${quest.title} (+${quest.xp} XP)`);
    else if (xpGained) toast.success(`+${xpGained} XP`);
  };

  const trade = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || busy) return;

    // Check if token has on-chain mint
    if (!token.onchainMint) {
      toast.error('This token is demo-only. On-chain trading requires a minted token.');
      return;
    }

    setBusy(true);
    try {
      const provider = getProvider();
      if (!provider) throw new Error('Install Phantom or Solflare');
      await provider.connect();

      const mint = new PublicKey(token.onchainMint);

      // Fetch live curve state from chain
      const curveState = await fetchCurveState(mint);
      if (!curveState) throw new Error('Curve state not found on-chain');
      if (curveState.complete) throw new Error('Curve is migration-ready — trading locked');

      // Build transaction
      const configuredFeeWallet = import.meta.env.VITE_FEE_WALLET;
      if (!configuredFeeWallet) throw new Error('Launchpad fee wallet is not configured');
      const feeWallet = new PublicKey(configuredFeeWallet);
      const creatorWallet = new PublicKey(token.creator);

      let tx: Transaction;
      if (tab === 'buy') {
        // Buy flow
        const quote = computeBuyQuote(amt, curveState.virtualSol, curveState.virtualTokens);
        const solLamports = solToLamports(amt);

        // Ensure ATA exists
        const ataIx = await ensureAtaIx(mint, provider.publicKey);

        const tradeIx = buildTradeIx('buy', provider.publicKey, mint, solLamports, quote.minOut, feeWallet, creatorWallet);
        tx = new Transaction();
        if (ataIx) tx.add(ataIx);
        tx.add(tradeIx);
      } else {
        // Sell flow - check balance first
        const quote = computeSellQuote(amt, curveState.virtualSol, curveState.virtualTokens);

        // Ensure ATA exists
        const ataIx = await ensureAtaIx(mint, provider.publicKey);

        const tokInRaw = BigInt(Math.floor(amt * 1_000_000));
        const tradeIx = buildTradeIx('sell', provider.publicKey, mint, tokInRaw, quote.minOut, feeWallet, creatorWallet);
        tx = new Transaction();
        if (ataIx) tx.add(ataIx);
        tx.add(tradeIx);
      }

      const sig = await sendTx(provider, tx);

      // Index the trade for XP/leaderboard
      await indexTrade({ mint: token.onchainMint, signature: sig, wallet: provider.publicKey.toBase58(), side: tab });

      // Refresh token from server
      const fresh = await fetchToken(token.id, identity);
      if (fresh) update(fresh);
      setAmount('');

      if (fresh?.complete) {
        confetti({ particleCount: 300, spread: 120, origin: { y: 0.6 } });
        toast.success(`🎓 ${token.ticker} curve closed. Migration is not implemented in V1.`);
      } else if (tab === 'buy') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors: ['#22c55e', '#a855f7', '#facc15'] });
        toast.success(`Bought on-chain! TX: ${sig.slice(0, 8)}…`);
      } else {
        toast.success(`Sold on-chain! TX: ${sig.slice(0, 8)}…`);
      }
      // XP will come from indexTrade response
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
      xpToast(r.xpGained, r.questCompleted);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Comment failed');
    }
  };

  const like = async () => {
    if (liked) return;
    setLiked(true); // optimistic — server dedupes anyway
    confetti({ particleCount: 22, spread: 55, startVelocity: 22, origin: { y: 0.8 }, colors: ['#f87171', '#fb7185', '#fca5a5'] });
    try {
      const r = await likeToken(token.id, identity);
      if (r.liked) xpToast(r.xpGained, r.questCompleted);
    } catch { /* keep optimistic state */ }
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
      setToken({ ...token, riskFlag: r.flag });
      toast.success(`🔮 The Oracle: ${r.score}/100 — ${r.flag}`);
    } catch { toast.error('The Oracle is meditating — try again'); }
    setAiBusy(null);
  };

  const share = async () => {
    const link = shareLink(profile?.ref_code || identity, token.id);
    const text = `$${token.ticker} — ${token.name}\n\n${Math.min(100, (token.realSol ?? 0) / MIGRATION_TARGET * 100).toFixed(0)}% to on-chain curve closure on Hermes Launchpad.\n\nLore & risk are AI-generated drafts — verify on-chain before trading.`;
    if (navigator.share) { try { await navigator.share({ title: token.name, text, url: link }); return; } catch { /* Share dismissed. */ } }
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const est = amount && tab === 'buy' && token.priceSol
    ? (parseFloat(amount) / token.priceSol).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : amount && tab === 'sell' && token.priceSol
    ? `${(parseFloat(amount) * token.priceSol).toFixed(4)} SOL`
    : '—';

  const progressPct = migrationProgress(token);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:justify-end" onClick={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-label={`${token.name} trading panel`} className="max-h-[94vh] w-full overscroll-contain overflow-y-auto rounded-t-xl border border-[#2a2a2a] bg-[#111] p-5 sm:h-full sm:max-h-none sm:w-[32rem] sm:rounded-none" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{token.emoji}</span>
            <div>
              <h2 className="text-xl font-bold text-white">
                {token.name} <span className="text-white/50 text-sm">${token.ticker}</span>
                {token.complete && <span className="ml-2 rounded-full border border-yellow-400/30 bg-yellow-400/20 px-2 py-0.5 text-xs text-yellow-300">MIGRATION READY</span>}
              </h2>
              <div className="text-xs text-white/50">{token.chain} · created by {token.creator}</div>
              {token.onchainMint && (
                <div className="mt-1 flex items-center gap-1 text-xs text-white/40">
                  <span className="font-mono truncate max-w-[200px]">{token.onchainMint}</span>
                  <a href={`https://explorer.solana.com/address/${token.onchainMint}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-pump hover:underline">Explorer</a>
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close trading panel" className="text-2xl leading-none text-white/50 hover:text-white">×</button>
        </div>

        <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-white/40">Price</div>
              <div className="text-lg font-bold text-white">{token.onchainMint && token.priceSol ? `${token.priceSol.toFixed(8)} SOL` : '—'}</div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3 text-center text-sm">
            <div><div className="text-[10px] text-white/40">Indexed SOL</div><div className="font-semibold text-white">{token.onchainMint && token.realSol !== undefined ? token.realSol.toFixed(1) : '—'}</div></div>
            <div><div className="text-[10px] text-white/40">Progress</div><div className="font-semibold text-white">{progressPct.toFixed(0)}%</div></div>
            <div><div className="text-[10px] text-white/40">Creator</div><div className="font-semibold text-white">{token.creator.slice(0, 6)}…{token.creator.slice(-4)}</div></div>
            <div>
              <div className="text-[10px] text-white/40">AI RISK</div>
              <div className="font-semibold text-white">{token.riskFlag ? 'Scanned' : 'Unscanned'}</div>
            </div>
          </div>
        </div>

        {/* AI Agents — the pump.fun-killer: no competitor has these */}
        <div className="mt-4 rounded-xl border border-purple-400/25 bg-gradient-to-b from-purple-500/10 to-transparent p-4">
          <div className="mb-3 flex items-center justify-between"><button onClick={() => setShowResearch((value) => !value)} aria-expanded={showResearch} className="text-xs font-black tracking-wide text-purple-200">AI RESEARCH {showResearch ? '−' : '+'}</button><span className="rounded-full border border-[#00ff66]/20 bg-[#00ff66]/10 px-2 py-0.5 text-[10px] text-pump">AI agents</span></div>
          <div className={showResearch ? 'grid grid-cols-2 gap-2' : 'hidden'}>
            <button
              onClick={callBard}
              disabled={aiBusy !== null}
              className="rounded-lg border border-purple-400/30 bg-purple-500/15 hover:bg-purple-500/25 disabled:opacity-60 p-3 text-left transition-colors"
            >
              <div className={`text-lg ${aiBusy === 'lore' ? 'animate-scan' : ''}`}>📜</div>
              <div className="text-sm font-bold text-purple-100">Ask The Bard</div>
              <div className="text-[10px] text-purple-300/70">{aiBusy === 'lore' ? 'Writing lore…' : 'Fresh narrative + share text'}</div>
            </button>
            <button
              onClick={callOracle}
              disabled={aiBusy !== null}
              className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-60 p-3 text-left transition-colors"
            >
              <div className={`text-lg ${aiBusy === 'risk' ? 'animate-scan' : ''}`}>🔮</div>
              <div className="text-sm font-bold text-cyan-100">Consult The Oracle</div>
              <div className="text-[10px] text-cyan-300/70">{aiBusy === 'risk' ? 'Scanning risk…' : 'Risk score + red flags'}</div>
            </button>
          </div>

          <div className={showResearch ? 'mt-3 rounded-lg border border-purple-400/15 bg-black/30 p-3' : 'hidden'}>
            <div className="text-[10px] font-semibold text-purple-300 mb-1">📜 THE BARD'S LORE</div>
            <p className="text-sm text-white/85 italic">"{token.lore}"</p>
          </div>

          <div className={showResearch ? 'mt-2 rounded-lg border border-cyan-400/15 bg-black/30 p-3' : 'hidden'}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] font-semibold text-cyan-300">🔮 THE ORACLE'S VERDICT</div>
              <div className="text-xs font-black text-white">{token.riskFlag ? 'Scanned' : 'Unscanned'}</div>
            </div>
            <p className="text-[11px] text-white/50 mt-1.5">{token.riskFlag ? `⚑ ${token.riskFlag}` : 'No scan on record — consult The Oracle.'}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>Migration threshold progress</span>
            <span>{token.onchainMint ? (token.realSol ?? 0).toFixed(1) : '—'} / {MIGRATION_TARGET} SOL default</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 via-green-400 to-emerald-300 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-[11px] text-white/40 mt-1">The default threshold is {MIGRATION_TARGET.toLocaleString()} SOL; deployed config may differ. Migration execution is not yet proven on devnet.</p>
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
              type="number" inputMode="decimal" aria-label={tab === 'buy' ? 'Amount in SOL' : 'Amount in tokens'}
              placeholder={tab === 'buy' ? 'Amount in SOL' : 'Amount in tokens'}
              className="mt-2 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-green-400/50"
            />
            <div className="flex justify-between text-xs text-white/50 mt-2">
              <span>{tab === 'buy' ? `You receive ≈ ${est} ${token.ticker}` : `You receive ≈ ${est}`}</span>
              <span>Fees: 0.5%</span>
            </div>
            <button
              onClick={trade}
              disabled={busy || !amount}
              className={`mt-3 w-full py-3 rounded-xl font-bold text-lg disabled:opacity-40 ${tab === 'buy' ? 'bg-green-500 hover:bg-green-400 text-black' : 'bg-red-500 hover:bg-red-400 text-white'}`}
            >
              {busy ? 'Executing on the curve…' : tab === 'buy' ? `Buy ${token.ticker}` : `Sell ${token.ticker}`}
            </button>
            <p className="text-center text-[10px] text-white/30 mt-2">
              Solana devnet transaction. On-chain state is authoritative; the indexer verifies the signature.
            </p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button onClick={like} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${liked ? 'bg-red-500/20 text-red-300 border border-red-400/30' : 'bg-white/10 text-white/70 hover:bg-white/15'}`}>
            <span key={String(liked)} className={liked ? 'animate-heart-pop' : ''}>{liked ? '❤️' : '🤍'}</span> Liked
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
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-white/60">💬 Comments</div>
            <div className="text-[10px] text-yellow-300/80">+25 XP per reply · quest progress</div>
          </div>
          <div className="max-h-44 overflow-y-auto space-y-2">
            {comments.map((c, i) => {
              const mine = c.wallet === identity;
              return (
                <div key={i} className={`text-sm rounded-lg px-2 py-1.5 ${mine ? 'bg-purple-500/10 border border-purple-400/25' : ''}`}>
                  <span className={`font-mono text-xs ${mine ? 'text-purple-200 font-bold' : 'text-purple-300'}`}>{mine ? 'you' : short(c.wallet)}</span>
                  <span className="text-white/40 text-xs ml-2">{ago(c.ts)}</span>
                  <div className="text-white/80">{c.text}</div>
                </div>
              );
            })}
            {comments.length === 0 && <p className="text-white/30 text-xs">No replies yet — be the first degen.</p>}
          </div>
          <div className="flex gap-2 mt-3">
            <div className="flex-1 relative">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendComment()}
                aria-label="Write a reply" maxLength={280} placeholder="Drop alpha (or cope)…"
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-400/50"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/25">{commentText.length}/280</span>
            </div>
            <button onClick={sendComment} className="px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-bold">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}