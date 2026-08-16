import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/Button";
import { FocusTrap } from "focus-trap-react";
import { confettiBurst } from "@/components/ConfettiBurst";
import { useTrade } from "@/hooks/useTrade";
import { computeBuyQuote, computeSellQuote, FEE_BPS, BPS_DENOM } from "@/lib/solana";
import type { Token } from "@/lib/tokens";
import type { TradeResult } from "@/lib/api";

interface Props {
  token: Token;
  wallet: string | null;
  onTradeComplete: (result: TradeResult) => void;
}

const BUY_PRESETS = [0.1, 0.5, 1, 5];
const SELL_PRESETS = [25, 50, 75, 100];

export default function TradePanel({ token, wallet, onTradeComplete }: Props) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const { executeTrade, pending, error, curve, balance, refreshCurve } = useTrade(token, wallet);

  useEffect(() => {
    refreshCurve();
  }, [refreshCurve]);

  const quote = useMemo(() => {
    const val = parseFloat(amount);
    if (!val || val <= 0 || !curve) return null;
    try {
      if (side === "buy") {
        const q = computeBuyQuote(val, curve.virtualSol, curve.virtualTokens);
        const fee = val * Number(FEE_BPS * 2n) / Number(BPS_DENOM);
        const price = val / (q.tokOut / 1_000_000);
        const impact = (val * 1_000_000_000) / curve.virtualSol * 100;
        return {
          receive: q.tokOut / 1_000_000,
          minReceive: Number(q.minOut) / 1_000_000,
          fee,
          price,
          impact: Math.min(impact, 100),
          solAmount: val,
        };
      } else {
        const q = computeSellQuote(val, curve.virtualSol, curve.virtualTokens);
        const fee = q.solOut * Number(FEE_BPS * 2n) / Number(BPS_DENOM);
        const impact = (val * 1_000_000) / curve.virtualTokens * 100;
        return {
          receive: q.solOut,
          minReceive: Number(q.minOut) / 1_000_000_000,
          fee,
          price: q.solOut / val,
          impact: Math.min(impact, 100),
          solAmount: q.solOut,
        };
      }
    } catch {
      return null;
    }
  }, [amount, side, curve]);

  const handleTrade = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    if (side === "buy" && balance !== null && val > balance) {
      return;
    }

    setShowConfirm(true);
  };

  const confirmTrade = async () => {
    const val = parseFloat(amount);
    setShowConfirm(false);
    const result = await executeTrade(side, val);
    if (result) {
      confettiBurst(side);
      onTradeComplete(result);
      setAmount("");
    }
  };

  const handlePreset = (preset: number) => {
    if (side === "buy") {
      setAmount(String(preset));
    } else {
      setAmount(String(preset));
    }
  };

  const fmtNum = (n: number, decimals = 4) =>
    n < 0.0001 ? n.toExponential(2) : n.toLocaleString(undefined, { maximumFractionDigits: decimals });

  // No wallet connected
  if (!wallet) {
    return (
      <div className="mb-4 rounded-lg border border-white/5 bg-black/20 p-4 text-center">
        <p className="text-sm text-white/50">Connect wallet to trade</p>
      </div>
    );
  }

  // Curve not loaded yet
  if (!curve) {
    return (
      <div className="mb-4 rounded-lg border border-white/5 bg-black/20 p-4">
        <div className="h-32 animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  // Curve complete — no more trading
  if (curve.complete) {
    return (
      <div className="mb-4 rounded-lg border border-pump/20 bg-pump/5 p-4 text-center">
        <p className="text-sm font-bold text-pump">🎓 Curve Complete — Graduated to Raydium</p>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-lg border border-white/10 bg-black/30 p-3">
      {/* Buy / Sell tabs */}
      <div className="mb-3 flex gap-1 rounded-lg bg-black/30 p-1">
        <button
          onClick={() => { setSide("buy"); setAmount(""); }}
          className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${
            side === "buy"
              ? "bg-[#00FF00]/15 text-[#00FF00]"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => { setSide("sell"); setAmount(""); }}
          className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${
            side === "sell"
              ? "bg-[#FF0000]/15 text-[#FF0000]"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          Sell
        </button>
      </div>

      {/* Amount input */}
      <div className="relative mb-2">
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, "");
            if (v.split(".").length <= 2) setAmount(v);
          }}
          placeholder="0.00"
          disabled={pending}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 pr-16 font-mono text-lg text-white placeholder:text-white/20 outline-none transition-colors focus:border-pump disabled:opacity-50"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white/40">
          {side === "buy" ? "SOL" : `$${token.ticker}`}
        </span>
      </div>

      {/* Balance display */}
      {side === "buy" && balance !== null && (
        <p className="mb-2 text-right text-[11px] text-white/35">
          Balance: <span className="font-mono tabular-nums">{fmtNum(balance)}</span> SOL
        </p>
      )}

      {/* Preset buttons */}
      <div className="mb-3 flex gap-1.5">
        {(side === "buy" ? BUY_PRESETS : SELL_PRESETS).map((p) => (
          <button
            key={p}
            onClick={() => handlePreset(p)}
            disabled={pending}
            className="flex-1 rounded-md border border-white/5 bg-white/5 py-1.5 text-xs font-bold text-white/50 transition-colors hover:bg-white/10 hover:text-white/80 disabled:opacity-50"
          >
            {side === "buy" ? `${p} SOL` : `${p}%`}
          </button>
        ))}
      </div>

      {/* Quote display */}
      {quote && (
        <div className="mb-3 space-y-1 rounded-lg border border-white/5 bg-black/20 px-3 py-2">
          <div className="flex justify-between text-xs">
            <span className="text-white/40">You receive</span>
            <span className="font-mono tabular-nums text-white/80">
              ≈ {fmtNum(quote.receive, side === "buy" ? 0 : 4)} {side === "buy" ? `$${token.ticker}` : "SOL"}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Price impact</span>
            <span className={`font-mono tabular-nums ${quote.impact > 5 ? "text-[#FF0000]" : "text-white/60"}`}>
              {fmtNum(quote.impact, 2)}%
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Fee (0.5%)</span>
            <span className="font-mono tabular-nums text-white/60">{fmtNum(quote.fee)} SOL</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Min received</span>
            <span className="font-mono tabular-nums text-white/60">
              {fmtNum(quote.minReceive, side === "buy" ? 0 : 4)} {side === "buy" ? `$${token.ticker}` : "SOL"}
            </span>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <p className="mb-2 text-center text-xs text-[#FF0000]/80">{error}</p>
      )}

      {/* Execute button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleTrade}
        loading={pending}
        disabled={!amount || parseFloat(amount) <= 0 || pending || (side === "buy" && balance !== null && parseFloat(amount) > balance)}
      >
        {pending
          ? "Confirming…"
          : side === "buy"
            ? `🟢 Buy $${token.ticker}`
            : `🔴 Sell $${token.ticker}`}
      </Button>

      {/* Slippage note */}
      <p className="mt-2 text-center text-[10px] text-white/25">
        Slippage tolerance: 1% · Devnet
      </p>

      {/* Confirmation Modal */}
      {showConfirm && quote && (
        <FocusTrap focusTrapOptions={{ initialFocus: false, allowOutsideClick: false }}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black">Confirm {side === "buy" ? "Buy" : "Sell"}</h2>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="text-white/50 hover:text-white text-xl"
                  aria-label="Cancel"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 rounded-xl bg-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-white/60">You {side === "buy" ? "pay" : "sell"}</span>
                  <span className="font-mono font-bold text-white">
                    {fmtNum(parseFloat(amount), 4)} {side === "buy" ? "SOL" : `$${token.ticker}`}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-white/60">You receive</span>
                  <span className="font-mono font-bold text-white">
                    ≈ {fmtNum(quote.receive, side === "buy" ? 0 : 4)} {side === "buy" ? `$${token.ticker}` : "SOL"}
                  </span>
                </div>
                <div className="h-px bg-white/10 my-3" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40">Price impact</span>
                  <span className={`text-xs font-mono ${quote.impact > 5 ? "text-red-400" : "text-white/60"}`}>
                    {fmtNum(quote.impact, 2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40">Fee</span>
                  <span className="text-xs font-mono text-white/60">{fmtNum(quote.fee)} SOL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Min received</span>
                  <span className="text-xs font-mono text-white/60">
                    {fmtNum(quote.minReceive, side === "buy" ? 0 : 4)} {side === "buy" ? `$${token.ticker}` : "SOL"}
                  </span>
                </div>
              </div>

              {quote.impact > 5 && (
                <div className="mb-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                  <p className="text-xs text-yellow-300">⚠️ High price impact! You may receive significantly less than expected.</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={confirmTrade}
                  loading={pending}
                >
                  {pending ? "Confirming…" : "Confirm"}
                </Button>
              </div>
            </div>
          </div>
        </FocusTrap>
      )}
    </div>
  );
}
