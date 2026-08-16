"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchQuests, fetchLeaderboard, fetchProfile, checkin, fetchReferrals } from "@/lib/api";
import { getAnonId } from "@/lib/identity";
import type { Quest, Trader, Profile, ReferralStats } from "@/lib/tokens";
import { Button } from "@/components/Button";
import Progress from "@/components/Progress";
import Badge from "@/components/Badge";
import Avatar from "@/components/Avatar";
import Stat from "@/components/Stat";

export default function Profile({ externalWallet, onBack }: { externalWallet?: string | null; onBack?: () => void }) {
  const wallet = externalWallet ?? getAnonId();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [ranks, setRanks] = useState<Trader[]>([]);
  const [referrals, setReferrals] = useState<ReferralStats | null>(null);
  const [refCopied, setRefCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dailyDone, setDailyDone] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const p = await fetchProfile(wallet);
      if (p) {
        setProfile(p);
        setDailyDone(Boolean((p as Profile & { daily_checked?: boolean }).daily_checked));
      }
      const [q, r, rf] = await Promise.all([
        fetchQuests(),
        fetchLeaderboard(),
        fetchReferrals(wallet),
      ]);
      setQuests(q.data ?? []);
      setRanks(r.data ?? []);
      setReferrals(rf);
    } finally {
      setBusy(false);
    }
  }, [wallet]);

  const startCheckin = useCallback(async () => {
    if (busy || dailyDone) return;
    setBusy(true);
    try {
      await checkin(wallet);
      setDailyDone(true);
      toast.success("Daily check-in claimed", { description: "+15 XP" });
      refresh();
    } catch (cause) {
      toast.error("Check-in failed", { description: cause instanceof Error ? cause.message : "try again" });
    } finally {
      setBusy(false);
    }
  }, [wallet, busy, dailyDone, refresh]);

  const copyRef = useCallback(async () => {
    const text = refCopied ? "" : wallet;
    try {
      await navigator.clipboard.writeText(text);
      setRefCopied(true);
      toast.success("Referral code copied");
      setTimeout(() => setRefCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  }, [wallet, refCopied]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-5 sm:px-6 sm:py-8">
      {onBack && (
        <button onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors">
          ← Back to feed
        </button>
      )}

      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-surface/80 p-4 backdrop-blur-md">
          <Avatar value={wallet} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="truncate font-bold text-white/90">{wallet.slice(0, 6)}…{wallet.slice(-4)}</p>
            <p className="text-xs text-white/45">{dailyDone ? "Check-in claimed today" : "Daily check-in ready"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onBack}>Feed</Button>
            {!dailyDone ? (
              <Button variant="primary" size="sm" onClick={startCheckin} loading={busy}>Check in</Button>
            ) : (
              <Button variant="ghost" size="sm" disabled>Claimed</Button>
            )}
          </div>
        </div>

        {profile && (
          <div className="grid grid-cols-2 gap-3">
            <Stat value={profile.level} label="Level" size="md" />
            <Stat value={profile.streak_days} label="Streak (days)" size="md" />
            <Stat value={profile.trades} label="Total trades" size="md" />
            <Stat value={profile.pnl >= 0 ? `+${profile.pnl.toFixed(2)}` : profile.pnl.toFixed(2)} label="P&L (SOL)" size="md" trend={profile.pnl >= 0 ? { value: 0, positive: true } : { value: 0, positive: false }} />
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-surface/80 p-4 backdrop-blur-md">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/60">Daily Quests</h3>
          {quests.length === 0 ? (
            <p className="text-sm text-white/40">No quests available</p>
          ) : (
            <div className="space-y-3">
              {quests.map((q) => (
                <div key={q.id} className="flex items-center gap-3">
                  <Progress value={q.progress} size="sm" showLabel label={q.done ? "Done" : `${q.progress}/${q.total}`} />
                  <span className="shrink-0 text-right text-xs text-white/50">{q.done ? "done" : `+${q.xp} XP`}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-surface/80 p-4 backdrop-blur-md">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/60">Leaderboard</h3>
          {ranks.length === 0 ? (
            <p className="text-sm text-white/40">No traders yet</p>
          ) : (
            <div className="space-y-2">
              {ranks.slice(0, 10).map((t, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/35 w-4">{i + 1}</span>
                    <span className="truncate font-semibold text-white/85 max-w-[120px] sm:max-w-[160px]">{t.name}</span>
                    {t.level != null && <Badge variant="pump" label={`Lvl ${t.level}`} />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/55">
                    <span>{t.trades} trades</span>
                    <span className={t.pnl >= 0 ? "text-pump" : "text-dump"}>{t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)} SOL</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-surface/80 p-4 backdrop-blur-md">
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-white/60">Invite Friends</h3>
          <p className="mb-3 text-[11px] text-white/40 leading-relaxed">Share your referral code — friends who board through your link earn you XP.</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-white/5 px-3 py-2 text-xs font-mono text-white/80 break-all">{wallet}</code>
              <Button variant={refCopied ? "ghost" : "secondary"} size="sm" onClick={copyRef}>{refCopied ? "Copied" : "Copy"}</Button>
            </div>
            {referrals && referrals.invites > 0 && (
              <p className="text-xs text-white/50">{referrals.invites} invite(s) · +{referrals.xpEarned} XP earned</p>
            )}
          </div>
        </div>

        {!profile && !busy && (
          <p className="text-center text-sm text-white/35">Not connected yet — connect a wallet to see your profile.</p>
        )}
      </div>
    </div>
  );
}
