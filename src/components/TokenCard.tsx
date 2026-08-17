import type { Token } from "@/lib/tokens";
import { tokenCurveStatus, migrationProgress } from "@/lib/token-truth";
import { useState } from "react";
import Badge from "@/components/Badge";

type BadgeVariant = "demo" | "active" | "migration-ready" | "onchain" | "indexed" | "agents" | "pump" | "hermes" | "oracle";

export default function TokenCard({ token, onSelect }: { token: Token; onSelect: (t: Token) => void }) {
  const status = tokenCurveStatus(token);
  const progress = migrationProgress(token);
  const [loreExpanded, setLoreExpanded] = useState(false);

  // Single priority badge logic: Demo > Live > Migration-ready > On-chain
  const getPriorityBadge = (): { variant: BadgeVariant; label: string } | null => {
    if (status === "demo") return { variant: "demo", label: "Demo" };
    if (status === "active") return { variant: "active", label: "Live" };
    if (status === "migration-ready") return { variant: "migration-ready", label: "Migration-ready" };
    if (token.provenance === "onchain") return { variant: "onchain", label: "On-chain" };
    return null;
  };

  const priorityBadge = getPriorityBadge();
  const showLore = token.lore && status !== "demo" && token.lore.length > 0;
  const loreText = token.lore ?? "";
  const shouldTruncateLore = !loreExpanded && loreText.length > 120;
  const displayLore = shouldTruncateLore ? `${loreText.slice(0, 120)}…` : loreText;

  const progressGlow = progress > 75;

  return (
    <button
      onClick={() => onSelect(token)}
      className={`group surface surface-w content-visibility-auto w-full rounded-xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] active:scale-[0.99]`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <span className="text-4xl" aria-hidden="true">{token.emoji}</span>
            {status === "active" && (
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-pump animate-pulse-glow" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="truncate font-bold text-base">{token.name}</span>
              <span className="font-mono text-xs text-white/50">${token.ticker}</span>
            </div>
            <div className="mt-0.5 truncate text-xs text-white/40">
              {token.creator ? `by ${token.creator.slice(0, 6)}…${token.creator.slice(-4)}` : "unknown creator"}
              {token.onchainMint && " · on-chain"}
            </div>
          </div>
        </div>
        {/* Priority badge - right aligned */}
        {priorityBadge && (
          <Badge
            variant={priorityBadge.variant}
            label={priorityBadge.label}
            className="flex-shrink-0"
          />
        )}
      </div>

      {/* Metrics row */}
      {status !== "demo" && token.realSol !== undefined && (
        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex flex-col items-start">
            <div className="text-xs text-white/40">SOL raised</div>
            <div className="text-lg font-bold font-mono text-white">{token.realSol.toFixed(1)}</div>
            <div className="text-xs text-white/30">{token.onchainMint ? "on-chain" : "indexed"}</div>
          </div>
          <div className="flex-1 max-w-xs">
            <div
              className={`relative overflow-hidden rounded-full bg-white/10 h-3 ${
                progressGlow ? "shadow-[0_0_12px_rgba(34,211,238,0.6)]" : ""
              }`}
            >
              <div
                className={[
                  "bg-gradient-to-r from-purple-500 via-green-400 to-emerald-300 transition-all duration-500 ease-out",
                  progressGlow && "animate-pulse-glow",
                ].join(" ")}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <div className="mt-1 text-right text-xs font-mono text-white/50">
              {progress.toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Lore - collapsible */}
      {showLore && (
        <div className="mt-3 rounded-lg bg-white/5 p-2.5">
          <div className="text-xs text-purple-300 font-semibold mb-1">📜 The Bard</div>
          <div className="relative">
            <p
              className={`text-xs text-white/60 italic transition-all duration-300 ${
                shouldTruncateLore ? "line-clamp-2" : ""
              }`}
            >
              "{displayLore}"
            </p>
            {shouldTruncateLore && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLoreExpanded(!loreExpanded);
                }}
                className="mt-1.5 inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                aria-expanded={loreExpanded}
                aria-controls="lore-content"
              >
                {loreExpanded ? "Show less" : "Read more"}
                <span className="text-[10px]">{loreExpanded ? "⌃" : "⌄"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status callout - migration ready */}
      {token.complete && (
        <div className="mt-3 flex items-center gap-2 rounded-full bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5">
          <span className="text-lg">🎓</span>
          <span className="text-xs font-semibold text-yellow-300">Migration ready</span>
        </div>
      )}
    </button>
  );
}