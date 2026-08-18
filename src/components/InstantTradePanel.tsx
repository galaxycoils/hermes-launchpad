/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/Button";
import { useTrade } from "@/hooks/useTrade";
import { computeBuyQuote, computeSellQuote, FEE_BPS, BPS_DENOM } from "@/lib/solana";
import type { Token } from "@/lib/tokens";

interface Props {
  token: Token | null;
  wallet: string;
  onClose: () => void;
  className?: string;
}

type TradeSide = "buy" | "sell";
type TxStatus = "idle" | "confirming" | "success" | "error";

const BUY_PRESETS = [0.1, 0.5, 1, 5];
const SLIPPAGE_OPTIONS = [0.5, 1, 3] as const;

export default function InstantTradePanel({ token, wallet, onClose }: Props) {
  const [side, setSide] = useState<TradeSide>("buy");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState<number>(1);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const { executeTrade, pending, error, curve, balance, refreshCurve } = useTrade(
    token ?? {
      id: "",
      name: "",
      ticker: "",
      emoji: "",
      lore: "",
      creator: "",
      chain: "SOL",
    },
    wallet
  );

  useEffect(() => {
    if (token?.onchainMint) {
      refreshCurve();
    }
  }, [token?.onchainMint, refreshCurve]);

  // Reset state when token changes
  useEffect(() => {
    setAmount("");
    setTxStatus("idle");
    setErrorMsg("");
  }, [token?.id]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9.]/g, "");
    if (v.split(".").length <= 2) {
      const num = parseFloat(v);
      if (v === "" || (num >= 0.01 && num <= 100)) {
        setAmount(v);
      }
    }
  }, []);

  const handlePreset = useCallback((preset: number) => {
    setAmount(String(preset));
  }, []);

  const handleMax = useCallback(() => {
    if (balance !== null && balance > 0) {
      setAmount(String(Math.floor(balance * 10000) / 10000));
    }
  }, [balance]);

  const quote = useMemo(() => {
    const val = parseFloat(amount);
    if (!val || val <= 0 || !curve) return null;
    try {
      if (side === "buy") {
        const q = computeBuyQuote(val, curve.virtualSol, curve.virtualTokens);
        const fee = val * Number(FEE_BPS * 2n) / Number(BPS_DENOM);
        const slippageMultiplier = 1 - slippage / 100;
        const minReceive = (q.tokOut / 1_000_000) * slippageMultiplier;
        return {
          receive: q.tokOut / 1_000_000,
          minReceive,
          fee,
          solAmount: val,
        };
      } else {
        const q = computeSellQuote(val, curve.virtualSol, curve.virtualTokens);
        const fee = q.solOut * Number(FEE_BPS * 2n) / Number(BPS_DENOM);
        const slippageMultiplier = 1 - slippage / 100;
        const minReceive = q.solOut * slippageMultiplier;
        return {
          receive: q.solOut,
          minReceive,
          fee,
          solAmount: q.solOut,
        };
      }
    } catch {
      return null;
    }
  }, [amount, side, curve, slippage]);

  const handleTrade = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0 || !token) return;

    if (side === "buy" && balance !== null && val > balance) {
      setErrorMsg("Insufficient SOL balance");
      return;
    }

    setTxStatus("confirming");
    setErrorMsg("");

    const result = await executeTrade(side, val);

    if (result) {
      setTxStatus("success");
      setAmount("");
      setTimeout(() => setTxStatus("idle"), 3000);
    } else {
      setTxStatus("error");
      setErrorMsg(error ?? "Transaction failed");
      setTimeout(() => setTxStatus("idle"), 4000);
    }
  };

  const fmtNum = (n: number, decimals = 4) =>
    n < 0.0001 ? n.toExponential(2) : n.toLocaleString(undefined, { maximumFractionDigits: decimals });

  const isValidToTrade =
    amount !== "" &&
    parseFloat(amount) >= 0.01 &&
    parseFloat(amount) <= 100 &&
    !pending &&
    !(side === "buy" && balance !== null && parseFloat(amount) > balance);

  // Price display
  const currentPrice = token?.priceSol ?? 0;
  const priceChange24h: number = 0; // Not available in current Token type

  return (
    <>
      <style>{`
        @keyframes itp-slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes itp-slide-in-bottom {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .itp-animate-slide-in-right {
          animation: itp-slide-in-right 300ms ease-out forwards;
        }
        .itp-animate-slide-in-bottom {
          animation: itp-slide-in-bottom 300ms ease-out forwards;
        }
      `}</style>
      <div
        className="fixed inset-y-0 right-0 z-50 flex flex-col w-[360px] max-w-full bg-[#0a0a0a] border-l border-white/10 shadow-2xl shadow-black/50 itp-animate-slide-in-right
                   max-sm:bottom-0 max-sm:top-auto max-sm:inset-x-0 max-sm:w-full max-sm:h-[50vh] max-sm:rounded-t-2xl max-sm:border-t max-sm:border-l-0 max-sm:itp-animate-slide-in-bottom"
        role="dialog"
        aria-label="Instant trade panel"
        aria-modal="false"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider">Trade</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close trade panel"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Token Info */}
          {token ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 text-2xl">
                {token.emoji || "🪙"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-white truncate">{token.name}</span>
                  <span className="font-mono text-xs text-white/50">${token.ticker}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs text-white/60">
                    {currentPrice > 0 ? `${fmtNum(currentPrice, 6)} SOL` : "—"}
                  </span>
                  {priceChange24h !== 0 && (
                    <span className={`text-xs font-bold ${priceChange24h >= 0 ? "text-[#00ff66]" : "text-[#ff3b30]"}`}>
                      {priceChange24h >= 0 ? "+" : ""}
                      {priceChange24h.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
              {token.complete && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#00ff66]/10 text-[#00ff66]">
                  Graduated
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <p className="text-sm text-white/40">Select a token to trade</p>
              <p className="text-xs text-white/20 mt-1">Pick any token from the list</p>
            </div>
          )}

          {/* Balance */}
          {wallet && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
              <span className="text-xs text-white/50">Balance</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white/80 tabular-nums">
                  {balance !== null ? fmtNum(balance) : "—"} SOL
                </span>
                {side === "buy" && balance !== null && balance > 0 && (
                  <button
                    onClick={handleMax}
                    className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#00ff66]/15 text-[#00ff66] hover:bg-[#00ff66]/25 transition-colors"
                  >
                    Max
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Buy / Sell Toggle */}
          <div className="flex gap-1 p-1 rounded-lg bg-black/40 border border-white/5">
            <button
              onClick={() => { setSide("buy"); setAmount(""); }}
              className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-all duration-200 ${
                side === "buy"
                  ? "bg-[#00ff66]/15 text-[#00ff66]"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => { setSide("sell"); setAmount(""); }}
              className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-all duration-200 ${
                side === "sell"
                  ? "bg-[#ff3b30]/15 text-[#ff3b30]"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Sell
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 font-medium">Amount</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                disabled={pending || !token}
                className="w-full h-12 rounded-lg border border-white/10 bg-black/40 px-4 pr-20 font-mono text-lg text-white placeholder:text-white/20 outline-none transition-colors focus:border-[#00ff66]/50 disabled:opacity-50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white/40">
                {side === "buy" ? "SOL" : `$${token?.ticker ?? ""}`}
              </span>
            </div>
            <p className="text-[10px] text-white/25">Min: 0.01 · Max: 100</p>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {BUY_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => handlePreset(p)}
                disabled={pending || !token}
                className={`rounded-lg border py-2 text-xs font-bold transition-all duration-150 ${
                  amount === String(p)
                    ? "border-[#00ff66]/40 bg-[#00ff66]/10 text-[#00ff66]"
                    : "border-white/5 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                } disabled:opacity-50`}
              >
                {p} SOL
              </button>
            ))}
          </div>

          {/* Slippage Selector */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 font-medium">Slippage Tolerance</label>
            <div className="flex gap-1.5">
              {SLIPPAGE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSlippage(s)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all duration-150 ${
                    slippage === s
                      ? "border-[#00ff66]/40 bg-[#00ff66]/10 text-[#00ff66]"
                      : "border-white/5 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                  }`}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>

          {/* Quote Display */}
          {quote && token && (
            <div className="space-y-2 rounded-xl border border-white/5 bg-black/20 p-3">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">You receive</span>
                <span className="font-mono tabular-nums text-white/80">
                  ≈ {fmtNum(quote.receive, side === "buy" ? 0 : 4)} {side === "buy" ? `$${token.ticker}` : "SOL"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Min received</span>
                <span className="font-mono tabular-nums text-white/60">
                  {fmtNum(quote.minReceive, side === "buy" ? 0 : 4)} {side === "buy" ? `$${token.ticker}` : "SOL"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Fee (0.5%)</span>
                <span className="font-mono tabular-nums text-white/60">{fmtNum(quote.fee)} SOL</span>
              </div>
            </div>
          )}

          {/* Transaction Status */}
          {txStatus !== "idle" && (
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                txStatus === "confirming"
                  ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                  : txStatus === "success"
                    ? "bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20"
                    : "bg-[#ff3b30]/10 text-[#ff3b30] border border-[#ff3b30]/20"
              }`}
            >
              {txStatus === "confirming" && (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              )}
              {txStatus === "success" && (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {txStatus === "error" && (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
              <span>
                {txStatus === "confirming" && "Confirming transaction..."}
                {txStatus === "success" && "Trade successful!"}
                {txStatus === "error" && (errorMsg || "Transaction failed")}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons (sticky bottom) */}
        <div className="p-4 border-t border-white/10 space-y-2 bg-[#0a0a0a]">
          {side === "buy" ? (
            <>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleTrade}
                loading={pending}
                disabled={!isValidToTrade || !token}
              >
                {pending ? "Confirming…" : `Buy $${token?.ticker ?? ""}`}
              </Button>
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={() => setSide("sell")}
                disabled={pending || !token}
                className="text-[#ff3b30] hover:bg-[#ff3b30]/10"
              >
                Switch to Sell
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="danger"
                size="lg"
                fullWidth
                onClick={handleTrade}
                loading={pending}
                disabled={!isValidToTrade || !token}
              >
                {pending ? "Confirming…" : `Sell $${token?.ticker ?? ""}`}
              </Button>
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={() => setSide("buy")}
                disabled={pending || !token}
                className="text-[#00ff66] hover:bg-[#00ff66]/10"
              >
                Switch to Buy
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
