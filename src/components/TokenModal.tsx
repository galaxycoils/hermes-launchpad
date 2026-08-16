import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FocusTrap } from "focus-trap-react";
import { Button } from "@/components/Button";
import Badge from "@/components/Badge";
import { confettiBurst } from "@/components/ConfettiBurst";
import TradePanel from "@/components/TradePanel";
import TradeReceiptCard from "@/components/TradeReceiptCard";
import { fmtUsd } from "@/lib/tokens";
import { formatUnixAge } from "@/lib/token-truth";
import type { Token, CommentItem } from "@/lib/tokens";
import type { TradeResult } from "@/lib/api";

interface Props {
  token: Token;
  onClose: () => void;
  onLike: (id: string) => void;
  liked: boolean;
  comments: CommentItem[];
  onComment: (text: string) => void;
  wallet: string | null;
  refCode?: string;
  onTradeComplete?: (result: TradeResult) => void;
}

export default function TokenModal({ token, onClose, onLike, liked, comments, onComment, wallet, refCode, onTradeComplete }: Props) {
  const [pending, setPending] = useState(false);
  const [comment, setComment] = useState("");
  const [tradeReceipt, setTradeReceipt] = useState<TradeResult | null>(null);

  const handleLike = useCallback(() => {
    if (pending) return;
    setPending(true);
    try {
      onLike(token.id);
      confettiBurst("like");
      toast.success(liked ? "Removed from watchlist" : "Added to watchlist");
    } catch {
      toast.error("Could not update watchlist");
    } finally {
      setPending(false);
    }
  }, [token.id, liked, onLike, pending]);

  const handleComment = useCallback(() => {
    const text = comment.trim();
    if (!text) return;
    setComment("");
    onComment(text);
    toast.success("Comment posted");
  }, [comment, onComment]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const verified = token.provenance === "onchain" || token.provenance === "index";
  const isDemo = token.provenance === "demo";

  return (
    <FocusTrap focusTrapOptions={{ initialFocus: false, allowOutsideClick: true }}>
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tm-title"
        className="w-full max-w-lg overscroll-contain rounded-t-xl border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{token.emoji}</span>
            <div>
              <h2 id="tm-title" className="text-lg font-black">
                {token.name} <span className="font-mono text-sm text-white/55">${token.ticker}</span>
              </h2>
              <p className="text-xs text-white/45">by {token.creator.slice(0, 6)}…{token.creator.slice(-4)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-xl text-white/60 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant={verified ? "onchain" : "demo"} label={verified ? "verified" : "demo"} />
          {token.complete && <Badge variant="migration-ready" label="migration ready" />}
          {isDemo && <Badge variant="agents" label="AI simulated" />}
        </div>

        {/* Inline capability state tags */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {token.onchainMint ? (
            <span className="rounded bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 text-[10px] font-mono text-green-300">
              Live · verified on-chain
            </span>
          ) : (
            <span className="rounded bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 text-[10px] font-mono text-yellow-300">
              Unavailable · not deployed
            </span>
          )}
          <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] font-mono text-white/50">
            Unavailable · AI disabled
          </span>
          <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] font-mono text-white/50">
            Unavailable · feature planned
          </span>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-white/5 bg-black/20 p-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-white/40">Raised</p>
            <p className="text-lg font-mono font-bold text-white">{fmtUsd((token.realSol ?? 0) * 180)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-white/40">Tokens</p>
            <p className="text-lg font-mono font-bold text-white">1,000,000</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-white/40">Price</p>
            <p className="text-lg font-mono font-bold text-white">{fmtUsd(token.priceSol || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-white/40">Pool</p>
            <p className="text-lg font-mono font-bold text-white">{fmtUsd((token.realSol ?? 0) * 180)}</p>
          </div>
        </div>

        {/* Trade Receipt Share Card */}
        {tradeReceipt && (
          <TradeReceiptCard
            result={tradeReceipt}
            token={token}
            refCode={refCode}
            onClose={() => setTradeReceipt(null)}
          />
        )}

        {/* Trade Panel — only for on-chain tokens */}
        {token.onchainMint ? (
          <TradePanel
            token={token}
            wallet={wallet}
            onTradeComplete={(result) => {
              confettiBurst(result.side);
              setTradeReceipt(result);
              onTradeComplete?.(result);
            }}
          />
        ) : (
          <div className="mb-4 rounded-lg border border-white/5 bg-black/20 p-3 text-center">
            <p className="text-xs text-white/40">Trading unavailable · token not deployed on-chain</p>
          </div>
        )}

        <div className="mb-4 rounded-lg border border-white/5 bg-black/20 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-white/60">Lore</p>
          <p className="mt-1 text-sm text-white/75">{token.lore}</p>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-white/60">Comments ({comments.length})</p>
            {wallet && (
              <div className="flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 280))}
                  onKeyDown={(e) => e.key === "Enter" && handleComment()}
                  placeholder="Add a comment..."
                  className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-pump"
                />
                <Button variant="primary" size="sm" onClick={handleComment} disabled={!comment.trim()}>
                  Post
                </Button>
              </div>
            )}
          </div>
          {comments.length === 0 ? (
            <p className="mt-2 text-xs text-white/35">No comments yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {comments.map((c) => (
                <li key={c.ts} className="rounded-md border border-white/5 bg-black/20 p-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-white/60">{c.wallet.slice(0, 6)}…{c.wallet.slice(-4)}</span>
                    <span className="text-white/30">{formatUnixAge(Math.floor(c.ts / 1000))}</span>
                  </div>
                  <p className="mt-1 text-sm text-white/75">{c.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="lg" fullWidth onClick={handleLike} loading={pending}>
            {liked ? "Unlike" : "Like"}
          </Button>
        </div>
      </div>
    </div>
    </FocusTrap>
  );
}
