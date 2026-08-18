import { useState, useCallback } from "react";
import { toast } from "sonner";

interface StreakInfo {
  days: number;
  xpGained: number;
  multiplier?: number;
}

interface QuestInfo {
  id: string;
  title: string;
  xp: number;
  completed: boolean;
}

/**
 * Retention hooks for streaks, quests, leaderboard, and push notifications.
 */
export function useRetention() {
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [pushPromptVisible, setPushPromptVisible] = useState(false);

  /**
   * Request notification permission (call after first trade)
   */
  const requestPushPermission = useCallback(async () => {
    if (typeof Notification === "undefined") {
      toast.error("Notifications not supported");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      toast.error("Notifications blocked in browser settings");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === "granted") {
        toast.success("Notifications enabled!");
        return true;
      }
      return false;
    } catch {
      toast.error("Could not request notification permission");
      return false;
    }
  }, []);

  /**
   * Show push permission prompt (call after first trade)
   */
  const showPushPrompt = useCallback(() => {
    if (pushPermission === "default") {
      setPushPromptVisible(true);
    }
  }, [pushPermission]);

  /**
   * Dismiss push prompt
   */
  const dismissPushPrompt = useCallback(() => {
    setPushPromptVisible(false);
  }, []);

  /**
   * Show re-engagement toast for graduation
   */
  const showGraduationToast = useCallback((tokenName: string, ticker: string) => {
    toast.success(`🎓 ${tokenName} (${ticker}) just graduated! Trade now →`, {
      duration: 8000,
      action: {
        label: "View",
        onClick: () => {
          // Scroll to token or navigate
        },
      },
    });
  }, []);

  /**
   * Show quest completion toast
   */
  const showQuestToast = useCallback((quest: QuestInfo) => {
    toast.success(`Quest: ${quest.title} ✅ +${quest.xp} XP`, {
      duration: 5000,
    });
  }, []);

  /**
   * Show streak toast
   */
  const showStreakToast = useCallback((streak: StreakInfo) => {
    const mult = streak.multiplier ? ` (${streak.multiplier}x)` : "";
    toast(`🔥 Day ${streak.days} streak! +${streak.xpGained} XP${mult}`, {
      duration: 5000,
    });
  }, []);

  return {
    pushPermission,
    pushPromptVisible,
    requestPushPermission,
    showPushPrompt,
    dismissPushPrompt,
    showGraduationToast,
    showQuestToast,
    showStreakToast,
  };
}
