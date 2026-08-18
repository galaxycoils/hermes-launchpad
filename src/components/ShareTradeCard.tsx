import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";
import { shareLink } from "@/lib/identity";
import type { Trade } from "@/lib/tokens";

/**
 * ShareTradeCard — generates a beautiful, shareable PNG card from trade data.
 * Dark card with neon accents, large PnL number, and one-tap social sharing.
 */

/** Extended trade data with token info and PnL for the share card. */
interface ShareTradeData extends Trade {
  tokenName?: string;
  tokenTicker?: string;
  tokenEmoji?: string;
  pnl?: number; // PnL percentage (e.g., 42.5 for +42.5%)
}

interface ShareTradeCardProps {
  trade: ShareTradeData | null;
  refCode?: string;
}

// ---- Canvas card rendering ----

const CARD_WIDTH = 600;
const CARD_HEIGHT = 800;

function drawShareCard(trade: ShareTradeData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  bgGrad.addColorStop(0, "#0a0a0f");
  bgGrad.addColorStop(0.5, "#111118");
  bgGrad.addColorStop(1, "#0a0a0f");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Neon border glow
  ctx.shadowColor = "#00ff66";
  ctx.shadowBlur = 30;
  ctx.strokeStyle = "#00ff66";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(16, 16, CARD_WIDTH - 32, CARD_HEIGHT - 32, 16);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Inner card surface
  const innerGrad = ctx.createLinearGradient(30, 30, 30, CARD_HEIGHT - 30);
  innerGrad.addColorStop(0, "rgba(255,255,255,0.04)");
  innerGrad.addColorStop(1, "rgba(255,255,255,0.01)");
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.roundRect(30, 30, CARD_WIDTH - 60, CARD_HEIGHT - 60, 12);
  ctx.fill();

  // Token emoji
  const emoji = trade.tokenEmoji ?? "🪙";
  ctx.font = "72px serif";
  ctx.textAlign = "center";
  ctx.fillText(emoji, CARD_WIDTH / 2, 140);

  // Token name
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  const tokenLabel = trade.tokenName
    ? `${trade.tokenName} ($${trade.tokenTicker ?? ""})`
    : `$${trade.tokenTicker ?? trade.token_id}`;
  ctx.fillText(tokenLabel, CARD_WIDTH / 2, 195);

  // Side badge
  const isBuy = trade.side === "buy";
  const badgeText = isBuy ? "BUY" : "SELL";
  const badgeColor = isBuy ? "#00ff66" : "#ff3b30";
  ctx.font = "bold 14px monospace";
  const badgeWidth = ctx.measureText(badgeText).width + 24;
  ctx.fillStyle = badgeColor + "33";
  ctx.beginPath();
  ctx.roundRect(CARD_WIDTH / 2 - badgeWidth / 2, 215, badgeWidth, 28, 14);
  ctx.fill();
  ctx.fillStyle = badgeColor;
  ctx.fillText(badgeText, CARD_WIDTH / 2, 234);

  // Large PnL number
  const pnl = trade.pnl ?? 0;
  const pnlSign = pnl >= 0 ? "+" : "";
  const pnlText = `${pnlSign}${pnl.toFixed(1)}%`;
  const pnlColor = pnl >= 0 ? "#00ff66" : "#ff3b30";

  ctx.font = "bold 80px system-ui, sans-serif";
  ctx.fillStyle = pnlColor;
  ctx.textAlign = "center";
  ctx.fillText(pnlText, CARD_WIDTH / 2, 340);

  // PnL glow effect
  ctx.shadowColor = pnlColor;
  ctx.shadowBlur = 40;
  ctx.fillText(pnlText, CARD_WIDTH / 2, 340);
  ctx.shadowBlur = 0;

  // Trade details section
  const detailsY = 400;
  ctx.font = "14px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.textAlign = "left";

  const details = [
    { label: "Price", value: `${trade.price.toFixed(6)} SOL` },
    { label: "SOL Amount", value: `${trade.sol_amount.toFixed(4)}` },
    { label: "Token Amount", value: `${trade.token_amount.toFixed(0)}` },
  ];

  let dy = detailsY;
  for (const d of details) {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText(d.label.toUpperCase(), 80, dy);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.fillText(d.value, CARD_WIDTH - 80, dy);
    ctx.textAlign = "left";
    dy += 32;
  }

  // Divider line
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, dy + 8);
  ctx.lineTo(CARD_WIDTH - 80, dy + 8);
  ctx.stroke();

  // Timestamp
  const ts = new Date(trade.ts * 1000);
  const tsStr = ts.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  ctx.font = "12px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.textAlign = "center";
  ctx.fillText(tsStr, CARD_WIDTH / 2, dy + 40);

  // Watermark
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillStyle = "rgba(168,85,247,0.8)";
  ctx.textAlign = "center";
  ctx.fillText("⚡ Trade on Hermes", CARD_WIDTH / 2, CARD_HEIGHT - 60);

  // Hermes branding accent
  ctx.font = "11px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillText("hermes-launchpad.pages.dev", CARD_WIDTH / 2, CARD_HEIGHT - 36);

  // Neon corner accents
  const cornerGrad = ctx.createLinearGradient(0, 0, 60, 0);
  cornerGrad.addColorStop(0, "rgba(0,255,102,0.4)");
  cornerGrad.addColorStop(1, "rgba(0,255,102,0)");
  ctx.fillStyle = cornerGrad;
  ctx.fillRect(30, 30, 60, 3);

  const cornerGrad2 = ctx.createLinearGradient(CARD_WIDTH - 60, 0, CARD_WIDTH, 0);
  cornerGrad2.addColorStop(0, "rgba(168,85,247,0)");
  cornerGrad2.addColorStop(1, "rgba(168,85,247,0.4)");
  ctx.fillStyle = cornerGrad2;
  ctx.fillRect(CARD_WIDTH - 90, 30, 60, 3);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create image blob"));
    }, "image/png");
  });
}

// ---- Component ----

export default function ShareTradeCard({ trade, refCode }: ShareTradeCardProps) {
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const link = shareLink(refCode ?? "", trade?.token_id);

  const generateImage = useCallback(async () => {
    if (!trade) return;
    setGenerating(true);
    try {
      const canvas = drawShareCard(trade);
      const url = canvas.toDataURL("image/png");
      setPreviewUrl(url);
      toast.success("Card ready to share!");
    } catch {
      toast.error("Failed to generate card");
    } finally {
      setGenerating(false);
    }
  }, [trade]);

  const handleDownload = useCallback(async () => {
    if (!trade) return;
    setGenerating(true);
    try {
      const canvas = drawShareCard(trade);
      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hermes-${trade.side}-${trade.tokenTicker ?? trade.token_id}-${trade.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Card downloaded!");
    } catch {
      toast.error("Failed to download card");
    } finally {
      setGenerating(false);
    }
  }, [trade]);

  const getShareText = (): string => {
    if (!trade) return "";
    const ticker = trade.tokenTicker ?? trade.token_id;
    const pnl = trade.pnl ?? 0;
    const pnlSign = pnl >= 0 ? "+" : "";
    return `Just ${trade.side === "buy" ? "bought" : "sold"} $${ticker} ${trade.tokenEmoji ?? "🪙"} on Hermes Launchpad! PnL: ${pnlSign}${pnl.toFixed(1)}% ⚡`;
  };

  const handleShare = async (platform?: "native" | "twitter" | "telegram" | "discord") => {
    const text = getShareText();
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,
      discord: link,
    };

    if (platform === "native" || !platform) {
      if (navigator.share) {
        try {
          // Try to share as image if preview exists
          if (previewUrl) {
            const blob = await fetch(previewUrl).then((r) => r.blob());
            const file = new File([blob], "hermes-trade.png", { type: "image/png" });
            if (navigator.canShare?.({ files: [file] })) {
              await navigator.share({
                title: "My Hermes Trade",
                text,
                url: link,
                files: [file],
              });
              return;
            }
          }
          await navigator.share({ title: "My Hermes Trade", text, url: link });
          return;
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            window.open(urls.twitter, "_blank");
          }
        }
      } else {
        window.open(urls.twitter, "_blank");
      }
    } else if (platform === "discord") {
      // Discord has no direct share URL — copy to clipboard
      try {
        await navigator.clipboard.writeText(`${text} ${link}`);
        toast.success("Copied! Paste in Discord.");
      } catch {
        window.open(urls.discord, "_blank");
      }
    } else {
      window.open(urls[platform], "_blank");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  if (!trade) {
    return (
      <div className="rounded-xl border border-white/10 bg-elevated/80 p-6 text-center">
        <p className="text-sm text-white/40">No trade data available</p>
      </div>
    );
  }

  const isBuy = trade.side === "buy";
  const pnl = trade.pnl ?? 0;
  const pnlPositive = pnl >= 0;

  return (
    <div className="space-y-4">
      {/* Card Preview */}
      <div
        ref={cardRef}
        className={cn(
          "relative mx-auto w-full max-w-[360px] overflow-hidden rounded-2xl border",
          "bg-gradient-to-b from-[#0a0a0f] via-[#111118] to-[#0a0a0f]",
          isBuy ? "border-pump/30 shadow-[0_0_40px_rgba(0,255,102,0.15)]" : "border-dump/30 shadow-[0_0_40px_rgba(255,59,48,0.15)]"
        )}
      >
        {/* Neon top accent */}
        <div className={cn("h-1 w-full", isBuy ? "bg-gradient-to-r from-transparent via-pump to-transparent" : "bg-gradient-to-r from-transparent via-dump to-transparent")} />

        <div className="p-6 text-center">
          {/* Token emoji */}
          <div className="mb-3 text-6xl">{trade.tokenEmoji ?? "🪙"}</div>

          {/* Token name */}
          <h3 className="text-lg font-black text-white">
            {trade.tokenName ?? trade.tokenTicker ?? trade.token_id}
          </h3>
          {trade.tokenTicker && (
            <p className="font-mono text-sm text-white/50">${trade.tokenTicker}</p>
          )}

          {/* Side badge */}
          <div className="mt-3 inline-flex">
            <span
              className={cn(
                "rounded-full px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider",
                isBuy ? "bg-pump/20 text-pump" : "bg-dump/20 text-dump"
              )}
            >
              {isBuy ? "Bought" : "Sold"}
            </span>
          </div>

          {/* Large PnL */}
          <div className="my-6">
            <p
              className={cn(
                "text-5xl font-black tracking-tight",
                pnlPositive ? "text-pump" : "text-dump"
              )}
              style={{
                textShadow: pnlPositive
                  ? "0 0 40px rgba(0,255,102,0.5)"
                  : "0 0 40px rgba(255,59,48,0.5)",
              }}
            >
              {pnl >= 0 ? "+" : ""}
              {pnl.toFixed(1)}%
            </p>
            <p className="mt-1 font-mono text-xs text-white/30">PnL</p>
          </div>

          {/* Trade details */}
          <div className="space-y-2 rounded-xl border border-white/5 bg-black/30 p-3">
            <DetailRow label="Price" value={`${trade.price.toFixed(6)} SOL`} />
            <DetailRow label="SOL Amount" value={trade.sol_amount.toFixed(4)} />
            <DetailRow label="Token Amount" value={trade.token_amount.toFixed(0)} />
          </div>

          {/* Timestamp */}
          <p className="mt-3 font-mono text-[10px] text-white/30">
            {new Date(trade.ts * 1000).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Watermark */}
        <div className="border-t border-white/5 bg-black/40 px-4 py-3 text-center">
          <p className="font-mono text-xs font-bold text-hermes/80">⚡ Trade on Hermes</p>
          <p className="font-mono text-[9px] text-white/25">hermes-launchpad.pages.dev</p>
        </div>
      </div>

      {/* Generated Image Preview */}
      {previewUrl && (
        <div className="rounded-xl border border-white/10 bg-elevated/60 p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-white/40">
            Generated Card
          </p>
          <img src={previewUrl} alt="Share card preview" className="w-full rounded-lg" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="md"
            fullWidth
            loading={generating}
            onClick={generateImage}
          >
            ✨ Generate Card
          </Button>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            loading={generating}
            onClick={handleDownload}
          >
            📥 Download
          </Button>
        </div>

        {/* Share buttons */}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" fullWidth onClick={() => handleShare("native")}>
            🚀 Share
          </Button>
          <Button variant="ghost" size="sm" fullWidth onClick={() => handleShare("twitter")}>
            𝕏 Twitter
          </Button>
          <Button variant="ghost" size="sm" fullWidth onClick={() => handleShare("telegram")}>
            ✈️ Telegram
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" fullWidth onClick={() => handleShare("discord")}>
            💬 Discord
          </Button>
          <Button variant="ghost" size="sm" fullWidth onClick={handleCopyLink}>
            📋 Copy Link
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Sub-components ----

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">
        {label}
      </span>
      <span className="font-mono text-xs font-bold text-white/90">{value}</span>
    </div>
  );
}