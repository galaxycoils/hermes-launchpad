import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { shareLink } from "@/lib/identity";
import type { Token } from "@/lib/tokens";
import type { TradeResult } from "@/lib/api";

interface Props {
  result: TradeResult;
  token: Token;
  refCode?: string;
  onClose: () => void;
}

export default function TradeReceiptCard({ result, token, refCode, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const link = shareLink(refCode ?? "");
  const shareText = `Just ${result.side === "buy" ? "bought" : "sold"} ${result.solAmount} SOL of $${token.ticker} ${token.emoji} on Hermes Launchpad! Launch or trade with my link: ${link}`;

  const handleShare = async (platform?: "native" | "twitter" | "telegram" | "discord") => {
    // Trigger confetti on share
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`,
      discord: `https://discord.com/share?url=${encodeURIComponent(link)}`,
    };

    if (platform === "native" || !platform) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Traded $${token.ticker} on Hermes`,
            text: shareText,
            url: link,
          });
          return;
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            window.open(urls.twitter, "_blank");
          }
        }
      } else {
        window.open(urls.twitter, "_blank");
      }
    } else if (urls[platform]) {
      window.open(urls[platform], "_blank");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <>
      <div className="mb-4 rounded-xl border border-pump/30 bg-gradient-to-b from-pump/10 via-black/40 to-black/60 p-4 text-center backdrop-blur-md">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-pump">
            🎉 Trade Confirmed
          </span>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xs font-mono"
          >
            dismiss
          </button>
        </div>

        <div className="my-3 flex items-center justify-center gap-3">
          <span className="text-4xl">{token.emoji}</span>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase ${
                  result.side === "buy"
                    ? "bg-pump/20 text-pump"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {result.side === "buy" ? "Bought" : "Sold"}
              </span>
              <span className="font-black text-white text-base">${token.ticker}</span>
            </div>
            <div className="font-mono text-sm text-white/80 font-bold">
              {result.solAmount} SOL
            </div>
          </div>
        </div>

        {refCode && (
          <div className="mb-3 rounded-lg border border-white/5 bg-black/40 px-3 py-1.5 text-xs text-white/60">
            Invite Code: <span className="font-mono font-bold text-white/90">{refCode}</span>
          </div>
        )}

        <div className="flex gap-2 mb-2">
          <Button variant="primary" size="sm" fullWidth onClick={() => handleShare("native")}>
            🚀 Share Trade
          </Button>
          <Button variant="secondary" size="sm" fullWidth onClick={handleCopy}>
            {copied ? "✓ Copied" : "📋 Copy Link"}
          </Button>
        </div>

        <div className="flex gap-1.5 text-xs">
          <Button variant="ghost" size="sm" fullWidth onClick={() => handleShare("twitter")}>
            𝕏
          </Button>
          <Button variant="ghost" size="sm" fullWidth onClick={() => handleShare("telegram")}>
            ☰
          </Button>
          <Button variant="ghost" size="sm" fullWidth onClick={() => handleShare("discord")}>
            ☰
          </Button>
        </div>
      </div>

      {showConfetti && <ConfettiBurst colors={["#00ff66", "#a855f7", "#fff", "#ffd700"]} particleCount={80} />}
    </>
  );
}
