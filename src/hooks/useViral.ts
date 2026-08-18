import { useCallback } from "react";
import { toast } from "sonner";
import { confettiBurst } from "@/components/ConfettiBurst";
import { shareLink } from "@/lib/identity";

interface TradeData {
  side: "buy" | "sell";
  solAmount: number;
  ticker: string;
  emoji: string;
}

interface TokenData {
  name: string;
  ticker: string;
  emoji: string;
}

/**
 * Viral hooks for share, confetti, and referral functionality.
 * All functions gracefully degrade when native APIs are unavailable.
 */
export function useViral(refCode?: string) {
  const shareTrade = useCallback(
    async (trade: TradeData) => {
      const link = shareLink(refCode ?? "");
      const text = `Just ${trade.side === "buy" ? "bought" : "sold"} ${trade.solAmount} SOL of $${trade.ticker} ${trade.emoji} on Hermes Launchpad! Launch or trade with my link: ${link}`;

      // Trigger confetti
      confettiBurst(trade.side === "buy" ? "buy" : "sell");

      if (navigator.share) {
        try {
          await navigator.share({
            title: `Traded $${trade.ticker} on Hermes`,
            text,
            url: link,
          });
          return;
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
              "_blank"
            );
          }
        }
      } else {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
          "_blank"
        );
      }
    },
    [refCode]
  );

  const shareGraduation = useCallback(
    async (token: TokenData) => {
      const link = shareLink(refCode ?? "");
      const text = `🎓 ${token.name} (${token.ticker}) just GRADUATED on Hermes Launchpad! 🚀

Curve completed - liquidity locked on DEX. Trade now: ${link}`;

      // Trigger confetti
      confettiBurst("migration");

      if (navigator.share) {
        try {
          await navigator.share({
            title: `${token.ticker} Graduated!`,
            text,
            url: link,
          });
          return;
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
              "_blank"
            );
          }
        }
      } else {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
          "_blank"
        );
      }
    },
    [refCode]
  );

  const copyReferralCode = useCallback(async () => {
    const link = shareLink(refCode ?? "");
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Referral link copied!");
      confettiBurst("like");
    } catch {
      toast.error("Could not copy link");
    }
  }, [refCode]);

  const triggerConfetti = useCallback(
    (preset: "buy" | "sell" | "create" | "like" | "migration" | "xp") => {
      confettiBurst(preset);
    },
    []
  );

  return {
    shareTrade,
    shareGraduation,
    copyReferralCode,
    triggerConfetti,
  };
}
