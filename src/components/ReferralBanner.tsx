import { useState } from "react";
import { toast } from "sonner";
import { shareLink } from "@/lib/identity";

interface ReferralBannerProps {
  code?: string;
  onDismiss?: () => void;
  storageKey?: string;
}

export default function ReferralBanner({
  code = "HERMES7X",
  onDismiss,
  storageKey = "referral_banner_dismissed",
}: ReferralBannerProps) {
  // Use lazy initialization to avoid calling setState in useEffect
  const [dismissed, setDismissed] = useState(() => {
    try {
      return Boolean(localStorage.getItem(storageKey));
    } catch {
      return false;
    }
  });
  const [copied, setCopied] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // Ignore
    }
    onDismiss?.();
  };

  const handleCopy = async () => {
    const link = shareLink(code);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  if (dismissed) return null;

  return (
    <div className="relative z-50 flex items-center justify-between border-b border-hermes/30 bg-gradient-to-r from-hermes/20 via-pump/10 to-hermes/20 px-3 py-1.5 text-xs text-white">
      <div className="mx-auto flex items-center gap-2">
        <span>🎁 <strong>Invite friends</strong> → earn XP on every trade</span>
        <button
          onClick={handleCopy}
          className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-pump hover:bg-white/20 transition-colors"
          aria-label={copied ? "Copied!" : "Copy referral link"}
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss banner"
        className="text-white/40 hover:text-white text-sm px-1.5"
      >
        ×
      </button>
    </div>
  );
}
