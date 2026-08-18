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
  try { confetti(opts as confetti.Options); } catch { /* silent */ }
}

export function xpFlyIn() {
  try {
    const raw: confetti.Options = {
      particleCount: 1,
      spread: 0,
      startVelocity: 45,
      colors: ["#ffd60a"],
      drift: 0,
    };
    confetti(raw);
  } catch { /* silent */ }
}

// React component wrapper
import { useEffect } from "react";

interface ConfettiBurstProps {
  colors?: string[];
  particleCount?: number;
  spread?: number;
  origin?: { y: number };
  startVelocity?: number;
  ticks?: number;
  drift?: number;
}

export function ConfettiBurst({
  colors = ["#00ff66", "#a855f7", "#ffd60a", "#fff"],
  particleCount = 100,
  spread = 80,
  origin = { y: 0.5 },
  startVelocity = 30,
  ticks = 200,
  drift = 0,
}: ConfettiBurstProps) {
  useEffect(() => {
    try {
      confetti({
        particleCount,
        spread,
        origin,
        startVelocity,
        colors,
        ticks,
        drift,
      });
    } catch {
      // Silent fail
    }
  }, [colors, particleCount, spread, origin, startVelocity, ticks, drift]);

  return null;
}

export function ConfettiPreset({ preset }: { preset: Preset }) {
  const opts = presets[preset];
  useEffect(() => {
    try {
      confetti(opts as confetti.Options);
    } catch {
      // Silent fail
    }
  }, [preset]);

  return null;
}
