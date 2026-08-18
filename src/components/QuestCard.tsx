import { Surface } from "./Surface";
import { Button } from "./Button";

type QuestType = "trade_count" | "new_token" | "share" | "checkin";

interface Quest {
  id: string;
  type: QuestType;
  title: string;
  progress: number;
  target: number;
  reward: number;
  claimed: boolean;
}

interface QuestCardProps {
  quest: Quest;
  onClaim: () => void;
}

const QUEST_ICONS: Record<QuestType, string> = {
  trade_count: "📊",
  new_token: "🪙",
  share: "📣",
  checkin: "✅",
};

const QUEST_TYPE_LABELS: Record<QuestType, string> = {
  trade_count: "Trade",
  new_token: "Token",
  share: "Share",
  checkin: "Check-in",
};

/**
 * QuestCard — single quest display with icon, title, progress bar,
 * reward amount, and claim button (disabled until complete).
 */
export default function QuestCard({ quest, onClaim }: QuestCardProps) {
  const isComplete = quest.progress >= quest.target;
  const progress = Math.min(100, (quest.progress / quest.target) * 100);
  const progressText = `${quest.progress}/${quest.target}`;

  return (
    <Surface className="p-4 space-y-3">
      {/* Top row: icon + title + type badge */}
      <div className="flex items-start gap-3">
        <span
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xl"
          role="img"
          aria-label={quest.type}
        >
          {QUEST_ICONS[quest.type]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white truncate">
              {quest.title}
            </h3>
            <span className="flex-shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wide border border-white/10 bg-white/5 text-white/50">
              {QUEST_TYPE_LABELS[quest.type]}
            </span>
          </div>
          <div className="text-xs text-white/40 mt-0.5">{progressText}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="overflow-hidden rounded-full h-2 bg-white/10">
          <div
            className={[
              "h-full rounded-full transition-all duration-500 ease-out",
              isComplete
                ? "bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 shadow-[0_0_10px_rgba(255,140,0,0.3)]"
                : "bg-gradient-to-r from-orange-500 to-red-500",
            ].join(" ")}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/35">
            {isComplete ? "Complete!" : `${Math.round(progress)}%`}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-gold">
            ⚡ {quest.reward} XP
          </span>
        </div>
      </div>

      {/* Claim button */}
      <Button
        variant="primary"
        size="sm"
        fullWidth
        disabled={!isComplete || quest.claimed}
        onClick={onClaim}
      >
        {quest.claimed ? "Claimed" : isComplete ? "Claim Reward" : "In Progress"}
      </Button>
    </Surface>
  );
}

export type { Quest, QuestType };
