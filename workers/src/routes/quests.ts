import { json, err } from '../../worker.js';

const now = () => Math.floor(Date.now() / 1000);
const validWallet = (w: string) => typeof w === "string" && /^[a-zA-Z0-9-]{3,64}$/.test(w);
const today = () => new Date().toISOString().slice(0, 10);
const levelFor = (xp: number) => Math.floor(Math.sqrt(xp / 250)) + 1;

// Base quest definitions (generated daily)
function generateDailyQuests(): Array<{ id: string; title: string; xp: number; total: string }> {
  return [
    { id: "daily_trades", title: "Make 3 trades today", xp: 500, total: "3" },
    { id: "daily_create", title: "Create a token", xp: 1000, total: "1" },
    { id: "daily_comments", title: "Comment on 2 tokens", xp: 300, total: "2" },
    { id: "daily_likes", title: "Like 3 tokens", xp: 200, total: "3" },
    { id: "daily_checkin", title: "Daily check-in", xp: 100, total: "1" },
  ];
}

// POST /api/checkin - Daily checkin (streak++)
export async function handleCheckin(db: any, body: any) {
  const wallet = body.wallet;
  if (!validWallet(wallet)) return err("valid wallet required", 400);

  // Ensure profile exists
  let p = await db.prepare("SELECT * FROM profiles WHERE wallet = ?").bind(wallet).first();
  if (!p) {
    await db.prepare(
      "INSERT INTO profiles (wallet, xp, level, ref_code, created_at) VALUES (?, 0, 1, ?, ?)"
    ).bind(wallet, wallet.slice(0, 6) + Math.random().toString(36).slice(2, 6), now()).run();
    p = { xp: 0, level: 1, streak_days: 0, last_active_day: null };
  }

  const d = today();

  // Already checked in today
  if (p.last_active_day === d) {
    return json({ ok: true, already: true, streak: p.streak_days, xpGained: 0 });
  }

  // Calculate streak
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = p.last_active_day === yesterday ? p.streak_days + 1 : 1;

  // Streak multipliers
  let multiplier = 1;
  if (streak >= 30) multiplier = 3;
  else if (streak >= 14) multiplier = 2;
  else if (streak >= 7) multiplier = 1.5;

  const xpGained = Math.round(100 * multiplier);

  // Update profile
  await db.prepare(
    "UPDATE profiles SET streak_days = ?, last_active_day = ? WHERE wallet = ?"
  ).bind(streak, d, wallet).run();

  // Award XP
  const newXp = p.xp + xpGained;
  const newLevel = levelFor(newXp);
  await db.prepare("UPDATE profiles SET xp = ?, level = ? WHERE wallet = ?")
    .bind(newXp, newLevel, wallet).run();

  // Update quest progress for checkin quest
  await db.prepare(
    `INSERT INTO quest_progress (wallet, quest_id, progress, done, day) VALUES (?, 'daily_checkin', 1, 1, ?)
     ON CONFLICT(wallet, quest_id, day) DO UPDATE SET progress = 1, done = 1`
  ).bind(wallet, d).run();

  return json({
    ok: true,
    streak,
    multiplier,
    xpGained,
    xp: newXp,
    level: newLevel,
    nextCheckin: new Date(Date.now() + 86400000).toISOString().slice(0, 10) + "T00:00:00Z",
  });
}

// GET /api/quests/:wallet - Get today's quests
export async function handleGetQuests(db: any, wallet: string) {
  if (!validWallet(wallet)) return err("invalid wallet", 400);

  const d = today();
  const quests = generateDailyQuests();

  // Get progress for today
  const { results: progress } = await db.prepare(
    "SELECT quest_id, progress, done FROM quest_progress WHERE wallet = ? AND day = ?"
  ).bind(wallet, d).all();

  const progressMap = new Map(
    progress.map((r: any) => [r.quest_id, { progress: r.progress, done: r.done }])
  );

  // Get wallet's actual stats for dynamic quest tracking
  const tradeCount = await db.prepare(
    "SELECT COUNT(*) as c FROM trades WHERE wallet = ? AND ts > ?"
  ).bind(wallet, now() - 86400).first();

  const createCount = await db.prepare(
    "SELECT COUNT(*) as c FROM tokens WHERE creator = ? AND created_at > ?"
  ).bind(wallet, now() - 86400).first();

  const commentCount = await db.prepare(
    "SELECT COUNT(*) as c FROM comments WHERE wallet = ? AND ts > ?"
  ).bind(wallet, now() - 86400).first();

  const likeCount = await db.prepare(
    "SELECT COUNT(*) as c FROM likes WHERE wallet = ? AND ts > ?"
  ).bind(wallet, now() - 86400).first();

  // Dynamic progress tracking
  const dynamicProgress: Record<string, number> = {
    daily_trades: tradeCount?.c || 0,
    daily_create: createCount?.c || 0,
    daily_comments: commentCount?.c || 0,
    daily_likes: likeCount?.c || 0,
    daily_checkin: progressMap.get("daily_checkin")?.done ? 1 : 0,
  };

  const questsWithProgress = quests.map((q) => {
    const total = parseInt(q.total, 10);
    const prog = Math.min(total, dynamicProgress[q.id] || 0);
    const saved = progressMap.get(q.id);
    const done = saved?.done || prog >= total;
    return {
      ...q,
      total,
      progress: prog,
      done,
      claimable: done && !saved?.done,
    };
  });

  // Get streak info
  const profile = await db.prepare(
    "SELECT streak_days FROM profiles WHERE wallet = ?"
  ).bind(wallet).first();

  return json({
    date: d,
    quests: questsWithProgress,
    streak: profile?.streak_days || 0,
    totalClaimable: questsWithProgress.filter((q: any) => q.claimable).length,
  });
}

// POST /api/quests/:wallet/claim - Claim completed quest XP
export async function handleClaimQuest(db: any, wallet: string, body: any) {
  if (!validWallet(wallet)) return err("invalid wallet", 400);

  const questId = body.questId;
  if (!questId || typeof questId !== "string") return err("questId required", 400);

  const d = today();

  // Check if quest is completed
  const progress = await db.prepare(
    "SELECT progress, done FROM quest_progress WHERE wallet = ? AND quest_id = ? AND day = ?"
  ).bind(wallet, questId, d).first();

  const quests = generateDailyQuests();
  const quest = quests.find((q) => q.id === questId);
  if (!quest) return err("unknown quest", 404);

  if (progress?.done) return err("already claimed", 409);

  // Check if actually complete
  const dynamicProgress: Record<string, number> = {};
  if (questId === "daily_trades") {
    const r = await db.prepare("SELECT COUNT(*) as c FROM trades WHERE wallet = ? AND ts > ?").bind(wallet, now() - 86400).first();
    dynamicProgress[questId] = r.c;
  } else if (questId === "daily_create") {
    const r = await db.prepare("SELECT COUNT(*) as c FROM tokens WHERE creator = ? AND created_at > ?").bind(wallet, now() - 86400).first();
    dynamicProgress[questId] = r.c;
  } else if (questId === "daily_comments") {
    const r = await db.prepare("SELECT COUNT(*) as c FROM comments WHERE wallet = ? AND ts > ?").bind(wallet, now() - 86400).first();
    dynamicProgress[questId] = r.c;
  } else if (questId === "daily_likes") {
    const r = await db.prepare("SELECT COUNT(*) as c FROM likes WHERE wallet = ? AND ts > ?").bind(wallet, now() - 86400).first();
    dynamicProgress[questId] = r.c;
  }

  const currentProgress = dynamicProgress[questId] || progress?.progress || 0;
  if (currentProgress < parseInt(quest.total, 10)) {
    return err("quest not yet complete", 409);
  }

  // Mark as done and award XP
  await db.prepare(
    `INSERT INTO quest_progress (wallet, quest_id, progress, done, day) VALUES (?, ?, ?, 1, ?)
     ON CONFLICT(wallet, quest_id, day) DO UPDATE SET done = 1, progress = ?`
  ).bind(wallet, questId, parseInt(quest.total, 10), d, parseInt(quest.total, 10)).run();

  // Award XP
  let p = await db.prepare("SELECT xp, level FROM profiles WHERE wallet = ?").bind(wallet).first();
  if (!p) {
    await db.prepare(
      "INSERT INTO profiles (wallet, xp, level, ref_code, created_at) VALUES (?, 0, 1, ?, ?)"
    ).bind(wallet, wallet.slice(0, 6) + Math.random().toString(36).slice(2, 6), now()).run();
    p = { xp: 0, level: 1 };
  }

  const newXp = p.xp + quest.xp;
  const newLevel = levelFor(newXp);
  await db.prepare("UPDATE profiles SET xp = ?, level = ? WHERE wallet = ?")
    .bind(newXp, newLevel, wallet).run();

  return json({
    ok: true,
    questId,
    xpGained: quest.xp,
    xp: newXp,
    level: newLevel,
  });
}
