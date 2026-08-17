"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { fetchTokens, fetchQuests, fetchLeaderboard, fetchProfile, checkin, fetchReferrals, postComment, likeToken } from "@/lib/api";
import { getAnonId, captureRef, shareLink } from "@/lib/identity";
import { connectWallet, isMobile, useWalletProvider } from "@/lib/wallet";
import { signAuthChallenge } from "@/lib/solana";
import type { Token, Quest, Trader, Profile, ReferralStats } from "@/lib/tokens";
import { filterVerifiedTokens, formatUnixAge } from "@/lib/token-truth";
import type { VerifiedTokenFilter } from "@/lib/token-truth";
import TokenCard from "@/components/TokenCard";
import TokenModal from "@/components/TokenModal";
import CreateTokenModal from "@/components/CreateTokenModal";
import GraduationModal from "@/components/GraduationModal";
import WalletSelectorModal from "@/components/WalletSelectorModal";
import KingOfHill from "@/components/KingOfHill";
import Hero from "@/components/Hero";
import TopNav from "@/components/TopNav";
import BottomTabBar from "@/components/BottomTabBar";
import { SkeletonCard } from "@/components/Skeleton";
import gsap from "gsap";
import { useGsapContext } from "@/hooks/useGsapContext";

type Filter = VerifiedTokenFilter;

/* eslint-disable react-hooks/set-state-in-effect */
export default function Home({ initialTab = "tokens" }: { initialTab?: "tokens" | "profile" }) {
  const { connecting: walletConnecting, providerDetected: walletDetected, retry: walletRetry } = useWalletProvider();

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Token | null>(null);
  const [tab, setTab] = useState<"tokens" | "profile">(initialTab);
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [tokensError, setTokensError] = useState<string | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [ranks, setRanks] = useState<Trader[]>([]);
  const [ranksLive, setRanksLive] = useState<boolean>(true);
  const [live, setLive] = useState(false);
  const [wallet, setWallet] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [refStats, setRefStats] = useState<ReferralStats | null>(null);
  const [graduatedToken, setGraduatedToken] = useState<Token | null>(null);

  const [anonId] = useState(getAnonId);
  const identity = wallet ?? anonId;

  // Auto-connect when provider detected after deep-link return
  useEffect(() => {
    if (walletDetected) {
      connectWallet(setWallet);
    }
  }, [walletDetected]);

  const checkGraduations = useCallback((tokens: Token[]) => {
    for (const t of tokens) {
      if (t.complete) {
        try {
          const key = `graduation_seen_${t.id}`;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, "1");
            try {
              const bc = new BroadcastChannel("hermes-graduation");
              bc.postMessage({ tokenId: t.id });
              bc.close();
            } catch {
              // ignore
            }
            setGraduatedToken(t);
            break;
          }
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const checkLikedGraduations = useCallback((tokens: Token[]) => {
    for (const t of tokens) {
      if (t.complete && t.liked) {
        try {
          const key = `grad_toast_liked_${t.id}`;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, "1");
            try {
              const bc = new BroadcastChannel("hermes-reengagement");
              bc.postMessage({ tokenId: t.id });
              bc.close();
            } catch {
              // ignore
            }
            toast.info(`🎓 ${t.name} ($${t.ticker}) from your watchlist just graduated!`, { duration: 6000 });
          }
        } catch {
          // ignore
        }
      }
    }
  }, []);

  useEffect(() => {
    let bc1: BroadcastChannel | null = null;
    let bc2: BroadcastChannel | null = null;
    try {
      bc1 = new BroadcastChannel("hermes-graduation");
      bc1.onmessage = (e) => {
        if (e.data?.tokenId) {
          try {
            localStorage.setItem(`graduation_seen_${e.data.tokenId}`, "1");
          } catch {
            // ignore
          }
        }
      };

      bc2 = new BroadcastChannel("hermes-reengagement");
      bc2.onmessage = (e) => {
        if (e.data?.tokenId) {
          try {
            localStorage.setItem(`grad_toast_liked_${e.data.tokenId}`, "1");
          } catch {
            // ignore
          }
        }
      };
    } catch {
      // ignore
    }
    return () => {
      try {
        bc1?.close();
        bc2?.close();
      } catch {
        // ignore
      }
    };
  }, []);

  const refreshProfile = useCallback(() => {
    fetchProfile(identity).then((p) => p && setProfile(p));
    fetchQuests(identity).then(({ data }) => setQuests(data));
  }, [identity]);

  useEffect(() => {
    const ref = captureRef();
    setTokensLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    setTokensError(null);
    fetchTokens().then(({ data, live: isLive }) => {
      setAllTokens(data);
      setTokensLoading(false);
      setLive(isLive);
      checkGraduations(data);
      checkLikedGraduations(data);
      const tid = new URLSearchParams(window.location.search).get("token");
      if (tid) {
        const t = data.find((x) => x.id === tid);
        if (t) setSelected(t);
      }
    }).catch((e) => {
      setTokensLoading(false);
      setTokensError(e instanceof Error ? e.message : "Failed to load tokens");
    });
    fetchLeaderboard().then(({ data, live: isLive }) => {
      setRanks(data);
      setRanksLive(isLive);
    });
    fetchProfile(identity, ref).then((p) => {
      if (p) setProfile(p);
      if (ref) toast.success(`🏴‍☠️ Boarded via referral — your referrer just got +750 XP`);
    });
    checkin(identity).then((c) => {
      if (!c) return;
      if (c.already) return;
      const mult = c.multiplier && c.multiplier > 1 ? ` · ${c.multiplier}x XP multiplier active` : "";
      toast(`🔥 Day ${c.streak} streak! +${c.xpGained ?? 50} XP${mult}`, { duration: 5000 });
    });
    fetchQuests(identity).then(({ data }) => setQuests(data));
  }, [identity, checkGraduations, checkLikedGraduations]);

  useEffect(() => {
    const iv = setInterval(() => {
      fetchTokens().then(({ data, live: isLive }) => {
        setAllTokens(data);
        setLive(isLive);
        checkGraduations(data);
        checkLikedGraduations(data);
      });
    }, 30000);
    return () => clearInterval(iv);
  }, [checkGraduations, checkLikedGraduations]);

  const onCreated = useCallback((t: Token) => {
    setAllTokens((prev) => [t, ...prev]);
    setShowCreate(false);
    setSelected(t);
    refreshProfile();
  }, [refreshProfile]);

  // TokenModal wire-up: like/comment state per token
  const likedByMe = (id: string) => allTokens.find((t) => t.id === id)?.liked;
  const selectedComments = (id: string) => allTokens.find((t) => t.id === id)?.comments ?? [];
  const handleLike = useCallback(async (id: string) => {
    const auth = wallet ? await signAuthChallenge(wallet) : null;
    try {
      await likeToken(id, auth ?? undefined);
    } catch { /* silent */ }
    setAllTokens((prev) =>
      prev.map((t) => (t.id === id ? { ...t, liked: !t.liked } : t))
    );
  }, [wallet]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleComment = useCallback(async (text: string) => {
    if (!selected?.id) return;
    const auth = wallet ? await signAuthChallenge(wallet) : null;
    try {
      await postComment(selected.id, wallet ?? '', text, auth ?? undefined);
    } catch { /* silent */ }
    setAllTokens((prev) =>
      prev.map((t) =>
        t.id === selected.id
          ? { ...t, comments: [...(t.comments ?? []), { wallet: identity, text, ts: Date.now() }] }
          : t
      )
    );
  }, [selected?.id, wallet, identity]);

  const tokens = useMemo(() => {
    const matches = allTokens.filter(
      (token) => (token.name + token.ticker).toLowerCase().includes(search.toLowerCase())
    );
    return filterVerifiedTokens(matches, filter);
  }, [filter, search, allTokens]);

  const king = useMemo(() => {
    const contenders = allTokens.filter(
      (token) => Boolean(token.onchainMint) && !token.complete && (token.realSol ?? 0) > 0
    );
    return filterVerifiedTokens(contenders, "curve-progress")[0] ?? null;
  }, [allTokens]);

  const [refLoading, setRefLoading] = useState(false);
  const [refError, setRefError] = useState<string | null>(null);

  const loadReferrals = useCallback(() => {
    setRefLoading(true);
    setRefError(null);
    fetchReferrals(identity)
      .then((s) => {
        setRefStats(s);
        if (!s) setRefError("Could not load referral data");
      })
      .catch(() => {
        setRefError("Could not load referral data");
      })
      .finally(() => {
        setRefLoading(false);
      });
  }, [identity]);

  useEffect(() => {
    if (tab === "profile") {
      let active = true;
      fetchReferrals(identity)
        .then((s) => {
          if (!active) return;
          setRefStats(s);
          if (!s) setRefError("Could not load referral data");
        })
        .catch(() => {
          if (!active) return;
          setRefError("Could not load referral data");
        });
      return () => {
        active = false;
      };
    }
  }, [tab, identity]);

  const copyRefLink = () => {
    const code = refStats?.code ?? profile?.ref_code ?? identity;
    navigator.clipboard.writeText(shareLink(code)).then(
      () => toast.success("🔗 Ref link copied — +750 XP for every degen who joins"),
      () => toast.error("Copy failed")
    );
  };

  const shareRefOnX = () => {
    const code = refStats?.code ?? profile?.ref_code ?? identity;
    const text = `🛸 Board Hermes Launchpad with my link — AI agents write the lore, the bonding curve never sleeps, and early degens stack XP.\n\n${shareLink(code)}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  useGsapContext(() => {
    const mm = gsap.matchMedia?.();
    if (!mm) return;
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set("[data-animate]", { clearProps: "all" });
    });
    mm.add("(min-width: 768px)", () => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(".hero-animate", { opacity: 0, y: 30, duration: 0.6 })
        .from(".feed-animate", { opacity: 0, y: 20, stagger: 0.1, duration: 0.4 }, "-=0.3");
    });
    mm.add("(max-width: 767px)", () => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(".hero-animate", { opacity: 0, y: 20, duration: 0.4 })
        .from(".feed-animate", { opacity: 0, y: 15, stagger: 0.05, duration: 0.3 }, "-=0.2");
    });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white" data-vaul-drawer-wrapper="">
      {/* Ambient background orbs */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-hermes/10 blur-[100px] animate-float" style={{ animationDelay: "0ms" }} />
        <div className="absolute top-20 right-0 h-[50vw] w-[50vw] rounded-full bg-pump/5 blur-[120px] animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-purple-500/10 blur-[80px] animate-float" style={{ animationDelay: "6s" }} />
      </div>

      <TopNav
        wallet={wallet}
        onWalletChange={setWallet}
        live={live}
        refCode={refStats?.code ?? profile?.ref_code ?? identity}
        streak={profile?.streak_days}
      />

      <main id="main-content" className="mx-auto max-w-6xl px-3 sm:px-4">
        {/* Hero */}
        <section className="hero-animate pt-6 sm:pt-10">
          <Hero onCreate={() => setShowCreate(true)} onRefCopy={copyRefLink} live={live} />
        </section>

        {/* King of Hill */}
        {king && (
          <section className="mt-4 feed-animate">
            <KingOfHill token={king} onSelect={setSelected} />
          </section>
        )}

        {/* AI Research hint */}
        <div className="mt-2 mb-4 flex items-center gap-2 text-xs text-white/50">
          <span className="rounded bg-hermes/20 px-2 py-1 font-mono text-purple-200">AI RESEARCH</span>
          <span>Open any token for Bard lore & Oracle risk signals.</span>
        </div>

        {/* Tab navigation */}
        <div className="mb-4 flex border-b border-white/10">
          {(["tokens", "profile"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                tab === k ? "border-pump text-pump" : "border-transparent text-white/50 hover:text-white/80"
              }`}
            >
              {k === "tokens" ? "Trade" : "Profile"}
            </button>
          ))}
        </div>

        {/* Tokens tab */}
        {tab === "tokens" && (
          <section className="feed-animate">
            {/* Top 3 Leaderboard snippet */}
            <div className="mb-4 rounded-xl border border-white/10 bg-surface p-3.5">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-white/50">🏆 Top Degens</span>
                <button
                  onClick={() => setTab("profile")}
                  className="text-[11px] font-mono text-pump hover:underline"
                >
                  Full Ranks →
                </button>
              </div>
              {!ranksLive ? (
                <p className="text-xs text-yellow-400 text-center py-1">⚠️ Could not load top traders</p>
              ) : ranks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ranks.slice(0, 3).map((r) => (
                    <div key={r.rank} className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/5 px-2.5 py-1.5 text-xs">
                      <span>{["🥇", "🥈", "🥉"][r.rank - 1] ?? r.rank}</span>
                      <span className="truncate font-semibold text-white/90 flex-1">{r.name}</span>
                      <span className="font-mono text-green-400 font-bold">${r.pnl.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-[40px] mb-2 animate-float-bob" aria-hidden="true">🏆</div>
                  <p className="text-xs text-white/40">No trades yet</p>
                  <p className="text-[10px] text-white/20 mt-1">Be the first degen</p>
                </div>
              )}
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tokens…"
                aria-label="Search tokens"
                className="flex-1 h-12 rounded-xl border border-white/10 bg-surface px-4 text-white placeholder:text-white/30 focus:border-pump focus:outline-none transition-colors"
              />
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(["all", "curve-progress", "migration-ready"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm capitalize transition-colors ${
                      filter === f
                        ? "border-pump bg-pump/10 text-pump"
                        : "border-white/10 bg-surface text-white/60 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {f === "curve-progress" ? "Curve" : f === "migration-ready" ? "Ready" : "All"}
                  </button>
                ))}
              </div>
            </div>

            {tokensError ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
                <div className="text-3xl mb-2">⚠️</div>
                <p className="text-sm text-red-300">{tokensError}</p>
                <button
                  onClick={() => {
                    setTokensError(null);
                    setTokensLoading(true);
                    fetchTokens().then(({ data, live: isLive }) => {
                      setAllTokens(data);
                      setTokensLoading(false);
                      setLive(isLive);
                    }).catch((e) => {
                      setTokensLoading(false);
                      setTokensError(e instanceof Error ? e.message : "Failed to load tokens");
                    });
                  }}
                  className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : tokensLoading ? (
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {tokens.map((t) => (
                  <TokenCard key={t.id} token={t} onSelect={setSelected} />
                ))}
              </div>
            )}

            {tokens.length === 0 && !tokensLoading && !tokensError && (
              <div className="rounded-xl border border-white/10 bg-surface p-8 text-center">
                <div className="text-[64px] mb-4 animate-float-bob" aria-hidden="true">🌀</div>
                <p className="text-white/80 font-semibold text-base mb-2">No tokens match. The void stares back.</p>
                <p className="text-xs text-white/30 mb-4">Launch the first one and the void fills.</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="rounded-lg bg-pump/10 border border-pump/20 px-5 py-2.5 text-sm font-bold text-pump hover:bg-pump/20 transition-colors"
                >
                  Launch Token
                </button>
              </div>
            )}
          </section>
        )}

        {/* Profile tab */}
        {tab === "profile" && (
          <section className="space-y-4 feed-animate">
            {/* Wallet Management */}
            <div className="rounded-xl border border-white/10 bg-surface p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">Connected Wallet</div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-white">
                    {wallet ? `${wallet.slice(0, 8)}…${wallet.slice(-8)}` : "Guest (Anonymous ID: " + anonId.slice(0, 6) + "…)"}
                  </div>
                </div>
                {wallet ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(wallet);
                        toast.success("Wallet address copied");
                      }}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/10 transition-colors"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        setWallet(null);
                        toast.info("Wallet disconnected");
                      }}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : walletConnecting ? (
                  <button
                    onClick={() => walletRetry()}
                    className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 text-xs font-bold text-yellow-300"
                  >
                    Still connecting… Retry
                  </button>
                ) : isMobile() ? (
                  <button
                    onClick={() => setShowWalletSelector(true)}
                    className="rounded-lg bg-hermes px-3 py-1.5 text-xs font-black text-white hover:bg-hermes/90 transition-all active:scale-[0.98]"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        await connectWallet(setWallet);
                        toast.success("Wallet connected!");
                      } catch {
                        // user canceled
                      }
                    }}
                    className="rounded-lg bg-hermes px-3 py-1.5 text-xs font-black text-white hover:bg-hermes/90 transition-all active:scale-[0.98]"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>

            {/* Level + XP */}
            <div className="rounded-xl border border-white/10 bg-surface p-5">
              <div className="flex items-center gap-4">
                <div className={`rounded-full p-2.5 ${
                  profile?.level ? "bg-gradient-to-br from-purple-500 to-hermes" : "bg-white/10"
                }`}>
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{profile?.level ?? "—"}</div>
                    <div className="text-[10px] uppercase tracking-wide text-white/40">Level</div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono text-white">
                      {profile?.xp?.toLocaleString() ?? "—"}
                    </span>
                    <span className="text-sm text-white/40">XP</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pump rounded-full transition-all duration-500"
                        style={{ width: `${(profile?.xp ?? 0) % 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-white/30">
                      {((profile?.xp ?? 0) % 100).toFixed(0)}% to next level
                    </span>
                  </div>
                  {profile?.streak_days ? (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-oracle/10 border border-oracle/20 px-2.5 py-1">
                      <span className="text-sm">🔥</span>
                      <span className="text-xs font-bold text-oracle">{profile.streak_days}-day streak</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Quests */}
            <div className="rounded-xl border border-white/10 bg-surface p-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/60">Daily Quests</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {quests.map((q) => (
                  <div
                    key={q.id}
                    className={`rounded-xl border p-4 ${
                      q.done
                        ? "border-green-400/30 bg-green-400/5"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {q.done ? "✅ " : ""}{q.title}
                      </span>
                      <span className="rounded bg-yellow-400/10 px-2 py-0.5 text-xs font-mono font-bold text-yellow-300 border border-yellow-400/20">
                        +{q.xp} XP
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          q.done ? "bg-green-400" : "bg-yellow-400"
                        }`}
                        style={{ width: `${Math.min(100, (q.progress / q.total) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                      {q.progress}/{q.total} complete{q.done ? " — paid out" : ""}
                    </div>
                  </div>
                ))}
                {quests.length === 0 && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center sm:col-span-2">
                    <p className="text-white/40 text-sm">No quests yet — quests launch with mainnet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Leaderboard */}
            {ranks.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-surface p-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/60">Leaderboard</h2>
                <div className="space-y-1">
                  {ranks.map((t) => (
                    <div
                      key={t.rank}
                      className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                    >
                      <span className="w-6 text-center font-black text-lg">
                        {t.rank <= 3 ? ["🥇", "🥈", "🥉"][t.rank - 1] : t.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="truncate font-semibold text-white">{t.name}</span>
                        {t.level ? (
                          <span className="ml-2 rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-purple-300 border border-purple-400/20">
                            LVL {t.level}
                          </span>
                        ) : null}
                      </div>
                      <span className="hidden sm:block text-xs text-white/40">
                        {t.trades} trades · {t.winRate}% win
                        {t.streak ? ` · 🔥${t.streak}` : ""}
                      </span>
                      <span className="text-green-400 font-bold font-mono text-sm">
                        ${t.pnl.toFixed(2)}
                      </span>
                      <span className="hidden sm:block text-xs text-purple-300 font-mono">
                        {t.xp.toLocaleString()} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Referral section */}
            <div className="rounded-xl border border-white/10 bg-surface p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-white/60">Recruit Degens</h2>
                <span className="rounded bg-gold/10 px-2 py-0.5 text-xs font-mono font-bold text-gold border border-gold/20">
                  +750 XP
                </span>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-yellow-400/5 to-transparent border border-gold/20 p-5 mb-4">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🏴‍☠️</div>
                  <h3 className="text-xl font-black text-white">Stack XP. Recruit degens.</h3>
                  <p className="mt-2 text-sm text-white/60 max-w-md mx-auto">
                    Every degen who boards through your link pays you{" "}
                    <b className="text-yellow-300">+{refStats?.xpPerInvite ?? 750} XP</b> instantly.
                    No cap, no vesting.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    readOnly
                    value={shareLink(refStats?.code ?? profile?.ref_code ?? identity)}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 rounded-lg bg-black/50 border border-white/10 px-3 py-2.5 text-xs font-mono text-purple-200 outline-none focus:border-hermes/50"
                  />
                  <button
                    onClick={copyRefLink}
                    className="px-4 rounded-lg bg-hermes hover:bg-hermes/90 text-sm font-bold text-white transition-colors active:scale-[0.97]"
                  >
                    Copy
                  </button>
                </div>

                <button
                  onClick={shareRefOnX}
                  className="mt-3 w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-semibold text-white/80 transition-colors"
                >
                  📣 Post your link on X
                </button>
              </div>

              {/* Loading state */}
              {refLoading && !refStats && (
                <div className="mb-4 rounded-xl border border-white/5 bg-white/5 p-4 text-center">
                  <div className="h-6 w-32 mx-auto animate-pulse rounded bg-white/10" />
                </div>
              )}

              {/* Error state */}
              {refError && !refStats && !refLoading && (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                  <p className="text-xs font-semibold text-red-400">Could not load referral data</p>
                  <button
                    onClick={loadReferrals}
                    className="mt-2 text-xs font-bold text-pump hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-white/5 p-4">
                  <div className="text-2xl font-bold font-mono text-white">{refStats?.invites ?? 0}</div>
                  <div className="text-[10px] uppercase tracking-wide text-white/40 mt-1">Recruits</div>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <div className="text-2xl font-bold font-mono text-yellow-300">
                    {(refStats?.xpEarned ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-white/40 mt-1">XP earned</div>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <div className="text-2xl font-bold font-mono text-purple-300">
                    +{refStats?.xpPerInvite ?? 750}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-white/40 mt-1">XP per recruit</div>
                </div>
              </div>

              {/* Recruits list or Empty state */}
              {refStats && refStats.referred && refStats.referred.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-xs font-semibold text-white/60 mb-2">Your recruits</h3>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {refStats.referred.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-sm border-b border-white/5 pb-1.5">
                        <span className="font-mono text-purple-300">{r.name}</span>
                        <span className="text-xs text-white/40">{formatUnixAge(r.ts)}</span>
                        <span className="text-xs text-yellow-300 font-bold">+750 XP</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-4 text-center">
                  <p className="text-xs text-white/40">No referrals yet — share your link to start earning XP</p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Mobile bottom tab bar */}
      <BottomTabBar tab={tab} onTabChange={setTab} onCreatePress={() => setShowCreate(true)} />

      {/* Footer */}
      <footer className="sm:hidden border-t border-white/10 px-4 py-4 text-center text-xs text-white/30">
        <p>🛸 Hermes Launchpad — AI-native fair launches on Solana.</p>
        <p className="mt-0.5">Devnet / experimental. Not financial advice.</p>
      </footer>

      {/* Modals */}
      {selected && (
        <TokenModal
          token={selected}
          onClose={() => {
            setSelected(null);
            refreshProfile();
          }}
          onLike={handleLike}
          liked={Boolean(likedByMe(selected.id))}
          comments={selectedComments(selected.id)}
          onComment={handleComment}
          wallet={wallet}
          refCode={refStats?.code ?? profile?.ref_code ?? identity}
          onTradeComplete={(result) => {
            fetchTokens().then(({ data }) => setAllTokens(data));
            refreshProfile();
            // Quest progress micro-toast — only if this trade completed a quest
            if (result.questCompleted) {
              toast.success(`Quest: ${result.questCompleted.title} ✅ +${result.questCompleted.xp} XP`);
            }
          }}
        />
      )}
      {showCreate && (
        <CreateTokenModal onClose={() => setShowCreate(false)} onCreated={onCreated} />
      )}
      {graduatedToken && (
        <GraduationModal token={graduatedToken} onClose={() => setGraduatedToken(null)} />
      )}

      <WalletSelectorModal
        open={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
        onSelect={(choice) => {
          setShowWalletSelector(false);
          connectWallet(setWallet, choice);
        }}
      />
    </div>
  );
}
