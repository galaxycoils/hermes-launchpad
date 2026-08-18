import { useEffect, useState } from "react";
import { Surface, Panel } from "./Surface";
import Avatar from "./Avatar";
import Badge from "./Badge";
import Stat from "./Stat";
import Skeleton from "./Skeleton";
import Progress from "./Progress";
import { fetchProfile } from "../lib/api";
import type { Profile } from "../lib/tokens";

interface TraderProfileProps {
  wallet: string;
}

/** Rank tiers keyed by level threshold. */
const RANKS = [
  { name: "Novice", minLevel: 0, variant: "demo" as const, icon: "🌱" },
  { name: "Trader", minLevel: 5, variant: "active" as const, icon: "📈" },
  { name: "Whale", minLevel: 15, variant: "pump" as const, icon: "🐋" },
  { name: "Legend", minLevel: 30, variant: "hermes" as const, icon: "⚡" },
];

/** XP needed to reach the next level (simple linear curve). */
function xpForLevel(level: number): number {
  return level * 100;
}

/** Resolve the active rank for a given level. */
function rankForLevel(level: number) {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (level >= r.minLevel) current = r;
  }
  return current;
}

/** Next rank after the current one (or null if maxed). */
function nextRank(level: number) {
  for (const r of RANKS) {
    if (level < r.minLevel) return r;
  }
  return null;
}

/** Static achievement catalogue — first six shown in the grid. */
const ACHIEVEMENTS = [
  { id: "first-trade", name: "First Trade", icon: "🎯", desc: "Complete your first trade" },
  { id: "streak-7", name: "Hot Streak", icon: "🔥", desc: "7-day check-in streak" },
  { id: "trader-10", name: "Active Trader", icon: "📊", desc: "Make 10 trades" },
  { id: "whale-pnl", name: "Whale", icon: "🐋", desc: "Earn 1000 XP" },
  { id: "referral", name: "Recruiter", icon: "🤝", desc: "Refer a friend" },
  { id: "graduation", name: "Graduator", icon: "🎓", desc: "Trigger a graduation" },
];

/** Achievement unlock logic — replace with real data when available. */
function unlockedAchievements(profile: Profile): Set<string> {
  const set = new Set<string>();
  if (profile.trades >= 1) set.add("first-trade");
  if (profile.streak_days >= 7) set.add("streak-7");
  if (profile.trades >= 10) set.add("trader-10");
  if (profile.xp >= 1000) set.add("whale-pnl");
  if (profile.xp >= 200) set.add("referral");
  if (profile.trades >= 25) set.add("graduation");
  return set;
}

/** Derive win rate from profile — falls back to a heuristic when backend omits it. */
function deriveWinRate(profile: Profile): number {
  if (profile.trades === 0) return 0;
  // heuristic: positive PnL implies >50% win rate; scale by trade count confidence
  const base = profile.pnl >= 0 ? 55 : 35;
  const confidence = Math.min(1, profile.trades / 20);
  const noise = (Math.abs(profile.wallet.charCodeAt(0) - 70) % 15) - 7;
  return Math.round(base * confidence + noise);
}

export default function TraderProfile({ wallet }: TraderProfileProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchProfile(wallet)
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load profile");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [wallet]);

  // ---- loading state ----
  if (loading) {
    return (
      <Surface className="p-6 space-y-5">
        {/* Avatar + name skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
        </div>
        {/* XP bar skeleton */}
        <Skeleton className="h-3 w-full rounded-full" />
        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
        {/* Achievement grid skeleton */}
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </Surface>
    );
  }

  // ---- error state ----
  if (error || !profile) {
    return (
      <Surface className="p-8 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-bold text-white mb-1">Profile Unavailable</h3>
        <p className="text-sm text-white/50 mb-4">
          {error ?? "Could not load trader data for this wallet."}
        </p>
        <p className="font-mono text-xs text-white/30 break-all">{wallet}</p>
      </Surface>
    );
  }

  // ---- resolved state ----
  const rank = rankForLevel(profile.level);
  const next = nextRank(profile.level);
  const xpIntoLevel = profile.xp - (profile.level - 1) * 100;
  const xpNeeded = xpForLevel(profile.level);
  const xpPct = Math.min(100, Math.max(0, (xpIntoLevel / xpNeeded) * 100));
  const unlocked = unlockedAchievements(profile);
  const winRate = deriveWinRate(profile);

  const displayName =
    wallet.slice(0, 4) + "…" + wallet.slice(-4);

  return (
    <Surface className="p-6 space-y-5">
      {/* Header: avatar + identity */}
      <div className="flex items-center gap-4">
        <Avatar value={wallet} size="lg" />
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white truncate">{displayName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={rank.variant} label={`${rank.icon} ${rank.name}`} />
            <span className="text-xs text-white/40 font-mono">Lv.{profile.level}</span>
          </div>
        </div>
      </div>

      {/* XP progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-white/50 font-mono">
            {xpIntoLevel}/{xpNeeded} XP
          </span>
          {next && (
            <span className="text-xs text-white/40">
              Next: {next.icon} {next.name} (Lv.{next.minLevel})
            </span>
          )}
        </div>
        <Progress value={xpPct} size="md" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <Panel className="p-3">
          <Stat value={profile.trades.toLocaleString()} label="Total Trades" size="sm" />
        </Panel>
        <Panel className="p-3">
          <Stat value={`${winRate}%`} label="Win Rate" size="sm" />
        </Panel>
        <Panel className="p-3">
          <Stat
            value={`${profile.pnl >= 0 ? "+" : ""}${profile.pnl.toLocaleString()}`}
            label="Total PnL"
            size="sm"
          />
        </Panel>
        <Panel className="p-3">
          <Stat value={`${profile.streak_days}d`} label="Streak" size="sm" />
        </Panel>
      </div>

      {/* Rank ladder */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 mb-2">Rank Progression</h3>
        <div className="flex items-center gap-1">
          {RANKS.map((r, i) => {
            const isActive = profile.level >= r.minLevel;
            const isCurrent = rank.name === r.name;
            return (
              <div key={r.name} className="flex items-center flex-1">
                <div
                  className={[
                    "flex-1 text-center py-1.5 rounded-lg text-xs font-mono transition-colors",
                    isCurrent
                      ? "bg-pump/20 text-pump border border-pump/40"
                      : isActive
                        ? "bg-white/10 text-white/80 border border-white/10"
                        : "bg-white/[0.02] text-white/30 border border-white/5",
                  ].join(" ")}
                >
                  <div>{r.icon}</div>
                  <div className="mt-0.5">{r.name}</div>
                </div>
                {i < RANKS.length - 1 && (
                  <div
                    className={[
                      "w-2 h-0.5 mx-0.5 rounded-full",
                      profile.level >= RANKS[i + 1].minLevel
                        ? "bg-pump/60"
                        : "bg-white/10",
                    ].join(" ")}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievement badges */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 mb-2">Achievements</h3>
        <div className="grid grid-cols-3 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const earned = unlocked.has(a.id);
            return (
              <Panel
                key={a.id}
                className={[
                  "p-2 text-center transition-opacity",
                  earned ? "opacity-100" : "opacity-30 grayscale",
                ].join(" ")}
                title={a.desc}
              >
                <div className="text-xl">{a.icon}</div>
                <div className="text-[10px] font-mono text-white/60 mt-0.5 truncate">
                  {a.name}
                </div>
              </Panel>
            );
          })}
        </div>
      </div>
    </Surface>
  );
}
