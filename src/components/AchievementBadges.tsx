import { useState, useEffect } from "react";
import { Surface } from "@/components/Surface";

// ---- types ----

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// ---- badge definitions ----

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_trade", name: "First Trade", description: "Made your first trade", icon: "🎯" },
  { id: "ten_trades", name: "Trader", description: "Completed 10 trades", icon: "📊" },
  { id: "hundred_trades", name: "Centurion", description: "Completed 100 trades", icon: "🏆" },
  { id: "whale", name: "Whale", description: "Single trade over 1 SOL", icon: "🐋" },
  { id: "mega_whale", name: "Mega Whale", description: "Single trade over 10 SOL", icon: "🐳" },
  { id: "early_bird", name: "Early Bird", description: "Bought within first minute of launch", icon: "🌅" },
  { id: "diamond_hands", name: "Diamond Hands", description: "Held a token for 7+ days", icon: "💎" },
  { id: "generous", name: "Generous", description: "Created a token for others to trade", icon: "🎁" },
  { id: "streak_7", name: "Week Streak", description: "7-day check-in streak", icon: "🔥" },
  { id: "streak_30", name: "Month Streak", description: "30-day check-in streak", icon: "⚡" },
  { id: "king_maker", name: "King Maker", description: "Graduated a token to Raydium", icon: "👑" },
  { id: "referrer_10", name: "Evangelist", description: "Referred 10 traders", icon: "📣" },
];

// ---- colors per badge (unlocked state) ----

const BADGE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  first_trade: { bg: "bg-pump/10", border: "border-pump/40", text: "text-pump", glow: "rgba(0,255,102,0.4)" },
  ten_trades: { bg: "bg-hermes/10", border: "border-hermes/40", text: "text-hermes", glow: "rgba(168,85,247,0.4)" },
  hundred_trades: { bg: "bg-gold/10", border: "border-gold/40", text: "text-gold", glow: "rgba(255,214,10,0.4)" },
  whale: { bg: "bg-sky-400/10", border: "border-sky-400/40", text: "text-sky-300", glow: "rgba(56,189,248,0.4)" },
  mega_whale: { bg: "bg-blue-500/10", border: "border-blue-500/40", text: "text-blue-300", glow: "rgba(59,130,246,0.4)" },
  early_bird: { bg: "bg-orange-400/10", border: "border-orange-400/40", text: "text-orange-300", glow: "rgba(251,146,60,0.4)" },
  diamond_hands: { bg: "bg-cyan-400/10", border: "border-cyan-400/40", text: "text-cyan-300", glow: "rgba(34,211,238,0.4)" },
  generous: { bg: "bg-pink-400/10", border: "border-pink-400/40", text: "text-pink-300", glow: "rgba(244,114,182,0.4)" },
  streak_7: { bg: "bg-red-400/10", border: "border-red-400/40", text: "text-red-300", glow: "rgba(248,113,113,0.4)" },
  streak_30: { bg: "bg-yellow-400/10", border: "border-yellow-400/40", text: "text-yellow-300", glow: "rgba(250,204,21,0.4)" },
  king_maker: { bg: "bg-gold/10", border: "border-gold/40", text: "text-gold", glow: "rgba(255,214,10,0.5)" },
  referrer_10: { bg: "bg-purple-400/10", border: "border-purple-400/40", text: "text-purple-300", glow: "rgba(192,132,252,0.4)" },
};

// ---- keyframes (injected once) ----

const STYLE_ID = "achievement-badge-keyframes";

function injectKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes badge-glow {
      0%, 100% { box-shadow: 0 0 8px var(--badge-glow-color), 0 0 0 transparent; }
      50% { box-shadow: 0 0 20px var(--badge-glow-color), 0 0 40px var(--badge-glow-color); }
    }
    @keyframes badge-pop {
      0% { transform: scale(0.8); opacity: 0; }
      60% { transform: scale(1.05); }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// ---- AchievementBadge component ----

interface AchievementBadgeProps {
  badge: Achievement | null;
  unlocked: boolean;
}

/**
 * Single achievement badge card.
 * Locked state: greyed out with "???" text.
 * Unlocked state: colorful with animated glow.
 */
export function AchievementBadge({ badge, unlocked }: AchievementBadgeProps) {
  if (!badge) return null;

  const colors = BADGE_COLORS[badge.id] ?? BADGE_COLORS.first_trade;

  return (
    <div
      className={[
        "group relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-300",
        unlocked
          ? `${colors.bg} ${colors.border} hover:-translate-y-1 hover:scale-[1.03]`
          : "border-white/5 bg-white/[0.02] opacity-40 grayscale",
      ].join(" ")}
      style={unlocked ? ({ ["--badge-glow-color" as string]: colors.glow, animation: "badge-glow 2.5s ease-in-out infinite" } as React.CSSProperties) : undefined}
    >
      {/* Glow ring behind icon when unlocked */}
      {unlocked && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ boxShadow: `inset 0 0 30px ${colors.glow}, 0 0 20px ${colors.glow}` }}
        />
      )}

      {/* Icon */}
      <span
        className={[
          "relative text-4xl transition-transform duration-300",
          unlocked ? "group-hover:scale-110" : "",
        ].join(" ")}
        style={unlocked ? { filter: "drop-shadow(0 0 6px " + colors.glow + ")" } : undefined}
        aria-hidden="true"
      >
        {unlocked ? badge.icon : "🔒"}
      </span>

      {/* Name */}
      <span
        className={[
          "relative text-xs font-bold uppercase tracking-wide text-center",
          unlocked ? colors.text : "text-white/30",
        ].join(" ")}
      >
        {unlocked ? badge.name : "???"}
      </span>

      {/* Description */}
      <span className="relative text-[10px] text-white/40 text-center leading-tight min-h-[24px]">
        {unlocked ? badge.description : "Keep trading to unlock"}
      </span>
    </div>
  );
}

// ---- AchievementGrid component ----

interface AchievementGridProps {
  wallet: string;
}

/**
 * Grid of all available achievements for a wallet.
 * Shows unlocked count and fetches from the API.
 */
export function AchievementGrid({ wallet }: AchievementGridProps) {
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    injectKeyframes();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchAchievements() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/profile/${encodeURIComponent(wallet)}/achievements`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: { achievements: string[] } = await res.json();
        if (!cancelled) {
          setUnlockedIds(new Set(data.achievements));
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setUnlockedIds(new Set());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (wallet) {
      fetchAchievements();
    } else {
      setLoading(false);
      setUnlockedIds(new Set());
    }

    return () => { cancelled = true; };
  }, [wallet]);

  const unlockedCount = unlockedIds.size;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <Surface className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white tracking-wide">Achievements</h2>
        <span className={[
          "font-mono text-sm font-bold px-3 py-1 rounded-full border",
          unlockedCount === totalCount
            ? "border-gold/40 bg-gold/10 text-gold"
            : "border-white/10 bg-white/5 text-white/60",
        ].join(" ")}>
          {unlockedCount}/{totalCount} unlocked
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map((a) => (
            <div key={a.id} className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-white/5" />
              <div className="w-16 h-3 rounded bg-white/5" />
              <div className="w-20 h-2 rounded bg-white/5" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="text-center py-8">
          <p className="text-white/40 text-sm">Failed to load achievements</p>
          <p className="text-white/20 text-xs mt-1">Check back later</p>
        </div>
      )}

      {/* Badge grid */}
      {!loading && !error && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map((badge, i) => (
            <div
              key={badge.id}
              className="animate-fly-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <AchievementBadge
                badge={badge}
                unlocked={unlockedIds.has(badge.id)}
              />
            </div>
          ))}
        </div>
      )}
    </Surface>
  );
}


export default function AchievementBadges({ profile }: { profile: any }) {
  const earnedIds = profile?.achievements ?? [];
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-white/60">Achievements</h3>
      <div className="flex flex-wrap gap-2">
        {ACHIEVEMENTS.map((a) => {
          const earned = earnedIds.includes(a.id);
          const className = earned
            ? "rounded-full px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-hermes text-white border border-purple-400/30"
            : "rounded-full px-2 py-1 text-xs bg-white/5 border border-white/10 text-white/60";
          return (
            <span key={a.id} className={className}>
              {a.icon} {a.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}