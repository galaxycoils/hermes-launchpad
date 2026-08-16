interface SurfaceProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Antigravity surface card — glassmorphism with layered depth.
 * Floating card feel via backdrop blur, soft border, subtle shadow.
 */
export function Surface({ className, children }: SurfaceProps) {
  return (
    <div
      className={[
        "rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        "transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]",
        "active:scale-[0.99]",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/**
 * Elevated surface for nested content — less blur, more solid.
 */
export function Panel({ className, children }: SurfaceProps) {
  return (
    <div
      className={[
        "rounded-xl border border-white/10 bg-elevated/80 backdrop-blur-md",
        "shadow-[0_4px_16px_rgba(0,0,0,0.3)]",
        "transition-all duration-300 hover:border-white/15 hover:bg-elevated",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/**
 * Gradient text utility — used for hero headlines with pump accent.
 */
export function GradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={[
        "bg-gradient-to-r from-purple-400 via-pump to-emerald-300 bg-clip-text text-transparent",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

/**
 * Ambient glow orbs — background depth layer.
 */
export function Orb({ className, delay }: { className?: string; delay?: number }) {
  return (
    <div
      className={[
        "absolute rounded-full blur-[80px] opacity-30 pointer-events-none",
        "animate-float",
        className ?? "",
      ].join(" ")}
      style={{ animationDelay: `${delay ?? 0}ms` }}
    />
  );
}

/**
 * XP floating badge — animated entrance for XP gains.
 */
export function XpFly({ text, onComplete }: { text: string; onComplete?: () => void }) {
  return (
    <div className="pointer-events-none fixed left-1/2 -translate-x-1/2 z-50 animate-fly-in" onClick={onComplete}>
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/20 border border-yellow-400/40 px-3 py-1 text-xs font-bold text-yellow-300 shadow-lg">
        ⚡ {text}
      </span>
    </div>
  );
}
