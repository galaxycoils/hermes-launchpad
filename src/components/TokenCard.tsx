import type { Token } from "@/lib/tokens";
import { tokenCurveStatus, migrationProgress } from "@/lib/token-truth";
import Badge from "@/components/Badge";
import Progress from "@/components/Progress";

export default function TokenCard({ token, onSelect }: { token: Token; onSelect: (t: Token) => void }) {
  const status = tokenCurveStatus(token);
  const progress = migrationProgress(token);

  return (
    <button
      onClick={() => onSelect(token)}
      className={`group surface surface-w content-visibility-auto w-full rounded-xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] active:scale-[0.99]`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="text-4xl" aria-hidden="true">{token.emoji}</span>
          {status === "active" && (
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-pump animate-pulse-glow" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-bold text-base">{token.name}</span>
            <span className="font-mono text-xs text-white/50">${token.ticker}</span>
            {status === "demo" && <Badge variant="demo" label="Demo" />}
            {status === "active" && <Badge variant="active" label="Live" />}
            {status === "migration-ready" && <Badge variant="migration-ready" label="Ready" />}
            {token.provenance === "onchain" && <Badge variant="onchain" label="On-chain" />}
          </div>
          <div className="mt-0.5 truncate text-xs text-white/40">
            {token.creator ? `by ${token.creator.slice(0, 6)}…${token.creator.slice(-4)}` : "unknown creator"}
            {token.onchainMint && " · on-chain"}
          </div>
        </div>
      </div>

      {/* Metrics row */}
      {status !== "demo" && token.realSol !== undefined && (
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <div className="text-xs text-white/40">SOL raised</div>
            <div className="text-lg font-bold font-mono text-white">{token.realSol.toFixed(1)}</div>
            <div className="text-xs text-white/30">{token.onchainMint ? "on-chain" : "indexed"}</div>
          </div>
          <Progress value={progress} size="sm" showLabel label={`${progress.toFixed(0)}%`} />
        </div>
      )}

      {/* Lore teaser */}
      {token.lore && status !== "demo" && (
        <div className="mt-3 rounded-lg bg-white/5 p-2.5">
          <div className="text-xs text-purple-300 font-semibold mb-1">📜 The Bard</div>
          <p className="text-xs text-white/60 italic line-clamp-2">"{token.lore}"</p>
        </div>
      )}

      {/* Status callout */}
      {token.complete && (
        <div className="mt-3 flex items-center gap-2 rounded-full bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5">
          <span className="text-lg">🎓</span>
          <span className="text-xs font-semibold text-yellow-300">Migration ready</span>
        </div>
      )}
    </button>
  );
}
