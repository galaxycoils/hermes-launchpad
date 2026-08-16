import confetti from "canvas-confetti";

type Preset = "buy" | "sell" | "create" | "like" | "migration" | "xp";

interface PresetOpts {
  particleCount: number;
  spread: number;
  origin?: { y: number };
  startVelocity?: number;
  colors: string[];
  ticks?: number;
  drift?: { x: number; y: number };
}

const presets: Record<Preset, PresetOpts> = {
  buy: { particleCount: 120, spread: 80, colors: ["#00ff66", "#a855f7", "#ffd60a"], drift: { x: 0, y: -20 }, origin: { y: 0.45 } },
  sell: { particleCount: 120, spread: 80, colors: ["#ff5555", "#a855f7", "#ffd60a"], drift: { x: 0, y: -20 }, origin: { y: 0.45 } },
  create: { particleCount: 180, spread: 120, colors: ["#00ff66", "#a855f7", "#22d3ee", "#ffd60a"], drift: { x: 0, y: -30 }, origin: { y: 0.35 } },
  like: { particleCount: 60, spread: 60, colors: ["#a855f7", "#22d3ee"], origin: { y: 0.55 } },
  migration: { particleCount: 160, spread: 100, colors: ["#a855f7", "#22d3ee", "#ffd60a"], ticks: 20, origin: { y: 0.4 } },
  xp: { particleCount: 1, spread: 0, colors: ["#ffd60a"], startVelocity: 45, drift: { x: 0, y: -40 } },
};

export function confettiBurst(preset: Preset) {
  const opts = presets[preset];
  try { confetti(opts as any); } catch { /* silent */ }
}

export function xpFlyIn() {
  try {
    const raw: any = {
      particleCount: 1,
      spread: 0,
      startVelocity: 45,
      colors: ["#ffd60a"],
      drift: { x: 0, y: -40 },
    };
    confetti(raw);
  } catch { /* silent */ }
}
