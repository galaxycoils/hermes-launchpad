import type { Token } from "@/lib/tokens";
import { migrationProgress, remainingToMigration } from "@/lib/token-truth";
import { Button } from "@/components/Button";
import Progress from "@/components/Progress";

export default function KingOfHill({ token, onSelect }: { token: Token; onSelect: (t: Token) => void }) {
  const progress = migrationProgress(token);
  const remaining = remainingToMigration(token);

  return (
    <button
      onClick={() => onSelect(token)}
      className="group w-full rounded-xl border border-gold/30 bg-gradient-to-br from-yellow-400/5 via-purple-500/5 to-pump/5 p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-gradient-to-br hover:from-yellow-400/10 hover:via-purple-500/10 hover:to-pump/10 hover:shadow-[0_8px_32px_rgba(255,214,10,0.15)] active:scale-[0.99]"
    >
      {/* Glow accent */}
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gold/10 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="text-5xl" aria-hidden="true">{token.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gold">
              King Of Hill
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="truncate text-xl font-black text-white">{token.name}</h2>
              <span className="font-mono text-sm text-white/50">${token.ticker}</span>
            </div>
          </div>
          {token.complete && (
            <div className="rounded-full bg-gold/20 border border-gold/40 px-2 py-0.5 text-xs font-bold text-gold">
              READY
            </div>
          )}
        </div>

        {/* Progress section */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Migration progress</span>
            <span className="font-mono text-gold font-bold">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} size="lg" />
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-white/50">
              {token.realSol ? token.realSol.toFixed(1) : "0.0"} / 85 SOL raised
            </span>
            <span className="font-mono text-white/30">
              {remaining.toFixed(1)} SOL to threshold
            </span>
          </div>
        </div>

        {/* Ape In button */}
        <div className="mt-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="font-black text-lg tracking-wide"
          >
            Ape In — ${token.ticker}
          </Button>
        </div>
      </div>
    </button>
  );
}
