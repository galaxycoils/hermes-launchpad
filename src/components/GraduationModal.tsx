import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { confettiBurst } from "@/components/ConfettiBurst";
import type { Token } from "@/lib/tokens";

interface Props {
  token: Token;
  onClose: () => void;
}

export default function GraduationModal({ token, onClose }: Props) {
  const [timeLeft, setTimeLeft] = useState(8);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mediaQuery.matches) {
      confettiBurst("migration");
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grad-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-yellow-400/40 bg-gradient-to-b from-yellow-950/40 via-surface to-surface p-6 text-center shadow-[0_0_60px_rgba(250,204,21,0.2)]">
        {/* Glow orb */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-yellow-400/20 blur-3xl" />

        {/* Mascot */}
        <div className="relative mx-auto my-3 flex h-24 w-24 items-center justify-center rounded-full bg-yellow-400/10 border-2 border-yellow-400/30 text-5xl animate-bounce">
          {token.emoji}
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400/20 border border-yellow-400/40 px-3 py-1 text-xs font-mono font-bold text-yellow-300">
          🎓 CURVE COMPLETED
        </div>

        <h2 id="grad-title" className="mt-3 text-2xl font-black text-white tracking-tight">
          ${token.ticker} HAS GRADUATED!
        </h2>
        <p className="mt-1 text-sm font-semibold text-yellow-200/80">
          {token.name} reached the bonding curve goal!
        </p>

        <p className="mt-3 text-xs text-white/60">
          100% of curve target collected. Liquidity is locked on-chain and ready for DEX trading.
        </p>

        {/* Progress timer */}
        <div className="mt-6 space-y-2">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-yellow-400 transition-all duration-1000 ease-linear"
              style={{ width: `${(timeLeft / 8) * 100}%` }}
            />
          </div>
          <p className="text-[11px] font-mono text-white/40">Auto-closing in {timeLeft}s</p>
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="primary" size="lg" fullWidth onClick={onClose}>
            🎉 Celebrate & Close
          </Button>
        </div>
      </div>
    </div>
  );
}
