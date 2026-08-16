import { useState, useCallback } from "react";
import { toast } from "sonner";
import { PublicKey, Transaction } from "@solana/web3.js";
import type { Token } from "@/lib/tokens";
import type { TradeResult } from "@/lib/api";
import { indexTrade } from "@/lib/api";
import {
  getProvider,
  sendTx,
  buildTradeIx,
  ensureAtaIx,
  computeBuyQuote,
  computeSellQuote,
  fetchCurveState,
  solToLamports,
  connection,
  type CurveState,
} from "@/lib/solana";

const FEE_WALLET = new PublicKey(
  import.meta.env.VITE_FEE_WALLET ?? "GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a"
);

export interface UseTradeReturn {
  executeTrade: (side: "buy" | "sell", amount: number) => Promise<TradeResult | null>;
  pending: boolean;
  error: string | null;
  curve: CurveState | null;
  balance: number | null;
  refreshCurve: () => Promise<void>;
}

export function useTrade(token: Token, wallet: string | null): UseTradeReturn {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [curve, setCurve] = useState<CurveState | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const refreshCurve = useCallback(async () => {
    if (!token.onchainMint) return;
    try {
      const mint = new PublicKey(token.onchainMint);
      const state = await fetchCurveState(mint);
      setCurve(state);
    } catch { /* silent */ }
    if (wallet) {
      try {
        const bal = await connection.getBalance(new PublicKey(wallet));
        setBalance(bal / 1_000_000_000);
      } catch { /* silent */ }
    }
  }, [token.onchainMint, wallet]);

  const executeTrade = useCallback(
    async (side: "buy" | "sell", amount: number): Promise<TradeResult | null> => {
      if (!wallet || !token.onchainMint || !curve) {
        toast.error("Wallet or token not ready");
        return null;
      }
      setPending(true);
      setError(null);

      try {
        const provider = getProvider();
        if (!provider) {
          throw new Error("No wallet found — install Phantom or Solflare");
        }

        const mint = new PublicKey(token.onchainMint);
        const trader = provider.publicKey;
        const creatorWallet = new PublicKey(token.creator);

        // Compute quote + minOut
        let amountRaw: bigint;
        let minOut: bigint;

        if (side === "buy") {
          const quote = computeBuyQuote(amount, curve.virtualSol, curve.virtualTokens);
          amountRaw = solToLamports(amount);
          minOut = quote.minOut;
        } else {
          const quote = computeSellQuote(amount, curve.virtualSol, curve.virtualTokens);
          amountRaw = BigInt(Math.floor(amount * 1_000_000));
          minOut = quote.minOut;
        }

        // Build instructions
        const tx = new Transaction();

        if (side === "buy") {
          const ataIx = await ensureAtaIx(mint, trader);
          if (ataIx) tx.add(ataIx);
        }

        tx.add(buildTradeIx(side, trader, mint, amountRaw, minOut, FEE_WALLET, creatorWallet));

        // Sign & send
        const signature = await sendTx(provider, tx);

        // Index trade (D1 + XP)
        const result = await indexTrade({
          mint: token.onchainMint,
          signature,
          wallet,
          side,
        });

        // Refresh curve state after trade
        await refreshCurve();

        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Trade failed";
        setError(msg);
        toast.error(msg);
        return null;
      } finally {
        setPending(false);
      }
    },
    [wallet, token.onchainMint, token.creator, curve, refreshCurve]
  );

  return { executeTrade, pending, error, curve, balance, refreshCurve };
}
