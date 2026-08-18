import { useMemo } from "react";
import { Surface } from "./Surface";

interface StreakCounterProps {
  streak: number;
}

const MILESTONES = [3, 7, 14, 30, 100];

/**
 * StreakCounter — displays current streak with fire gradient,
 * progress bar to next milestone, and milestone markers.
 */
export default function StreakCounter({ streak }: StreakCounterProps) {
  const { currentMilestone, nextMilestone, progress } = useMemo(() => {
    const next = MILESTONES.find((m) => m > streak) ?? MILESTONES[MILESTONES.length - 1];
    const milestonesCompleted = MILESTONES.filter((m) => streak >= m);
    const current = milestonesCompleted.length > 0 ? milestonesCompleted[milestonesCompleted.length - 1] : 0;
    const prevMilestone = current;
    const range = next - prevMilestone;
    const progress = range > 0 ? Math.min(100, ((streak - prevMilestone) / range) * 100) : 100;
    return { currentMilestone: current, nextMilestone: next, progress };
  }, [streak]);

  const isMaxMilestone = streak >= MILESTONES[MILESTONES.length - 1];

  return (
    <Surface className="p-5 space-y-4">
      {/* Header: streak display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl" role="img" aria-label="fire">
            🔥
          </span>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {streak} day{streak !== 1 ? "s" : ""}
            </div>
            <div className="text-xs text-white/45">Current streak</div>
          </div>
        </div>
        {!isMaxMilestone && (
          <div className="text-right">
            <div className="text-xs text-white/45">Next milestone</div>
            <div className="text-sm font-semibold text-orange-300 font-mono">
              {nextMilestone} days
            </div>
          </div>
        )}
      </div>

      {/* Progress bar to next milestone */}
      {!isMaxMilestone && (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-full h-3 bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 transition-all duration-500 ease-out shadow-[0_0_12px_rgba(255,140,0,0.4)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-white/35">
            <span>{currentMilestone}d</span>
            <span>{Math.round(progress)}%</span>
            <span>{nextMilestone}d</span>
          </div>
        </div>
      )}

      {/* Max milestone celebration */}
      {isMaxMilestone && (
        <div className="overflow-hidden rounded-full h-3 bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 shadow-[0_0_16px_rgba(255,140,0,0.5)] animate-pulse-glow" />
      )}

      {/* Milestone markers */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {MILESTONES.map((m) => {
          const reached = streak >= m;
          return (
            <span
              key={m}
              className={[
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wide transition-all duration-300",
                reached
                  ? "border border-orange-400/40 bg-orange-500/20 text-orange-200"
                  : "border border-white/10 bg-white/5 text-white/30",
              ].join(" ")}
            >
              {reached ? "🔥" : ""} {m}d
            </span>
          );
        })}
      </div>
    </Surface>
  );
}
