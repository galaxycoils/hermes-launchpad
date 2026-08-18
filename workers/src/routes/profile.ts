import { json, err } from '../../worker.js';

const now = () => Math.floor(Date.now() / 1000);
const validWallet = (w: string) => typeof w === "string" && /^[a-zA-Z0-9-]{3,64}$/.test(w);
const levelFor = (xp: number) => Math.floor(Math.sqrt(xp / 250)) + 1;

// Rank thresholds based on XP
function rankFor(xp: number): string {
  if (xp >= 50000) return "legend";
  if (xp >= 25000) return "master";
  if (xp >= 10000) return "expert";
  if (xp >= 5000) return "adept";
  if (xp >= 1000) return "apprentice";
  return "novice";
}

// GET /api/profile/:wallet - Get profile (xp, level, rank, stats)
export async function handleGetProfile(db: any, wallet: string) {
  if (!validWallet(wallet)) return err("invalid wallet", 400);
  const p = await db.prepare(
    "SELECT wallet, xp, level, streak_days, ref_code, referred_by, trades, wins, pnl, display_name, avatar_url, rank, total_trades, win_rate, total_pnl, referral_code, created_at FROM profiles WHERE wallet = ?"
  ).bind(wallet).first();

  if (!p) return err("profile not found", 404);

  const rank = p.rank || rankFor(p.xp);
  const winRate = p.trades > 0 ? Math.round((p.wins / p.trades) * 100) : 0;

  return json({
    wallet: p.wallet,
    displayName: p.display_name || null,
    avatarUrl: p.avatar_url || null,
    xp: p.xp,
    level: p.level,
    rank,
    streakDays: p.streak_days,
    refCode: p.ref_code,
    referredBy: p.referred_by,
    stats: {
      trades: p.trades,
      wins: p.wins,
      winRate,
      pnl: Math.round(p.pnl * 100) / 100,
    },
    createdAt: p.created_at,
  });
}

// PUT /api/profile/:wallet - Update display_name, avatar_url
export async function handleUpdateProfile(db: any, wallet: string, body: any) {
  if (!validWallet(wallet)) return err("invalid wallet", 400);

  const fields: string[] = [];
  const values: any[] = [];

  if (body.displayName !== undefined) {
    const name = String(body.displayName).trim().slice(0, 32);
    fields.push("display_name = ?");
    values.push(name);
  }
  if (body.avatarUrl !== undefined) {
    const url = String(body.avatarUrl).trim().slice(0, 512);
    fields.push("avatar_url = ?");
    values.push(url);
  }

  if (fields.length === 0) return err("no valid fields to update", 400);

  // Ensure profile exists
  const existing = await db.prepare("SELECT wallet FROM profiles WHERE wallet = ?").bind(wallet).first();
  if (!existing) {
    await db.prepare(
      "INSERT INTO profiles (wallet, xp, level, ref_code, created_at) VALUES (?, 0, 1, ?, ?)"
    ).bind(wallet, wallet.slice(0, 6) + Math.random().toString(36).slice(2, 6), now()).run();
  }

  values.push(wallet);
  await db.prepare(
    `UPDATE profiles SET ${fields.join(", ")} WHERE wallet = ?`
  ).bind(...values).run();

  return json({ ok: true });
}

// GET /api/profile/:wallet/portfolio - Get holdings + PnL
export async function handleGetPortfolio(db: any, wallet: string) {
  if (!validWallet(wallet)) return err("invalid wallet", 400);

  const { results: positions } = await db.prepare(
    `SELECT p.token_id, p.tokens, p.avg_cost, t.name, t.ticker, t.price as current_price, t.emoji
     FROM positions p
     JOIN tokens t ON p.token_id = t.id
     WHERE p.wallet = ? AND p.tokens > 0.000001
     ORDER BY (p.tokens * t.price) DESC`
  ).bind(wallet).all();

  const holdings = positions.map((pos: any) => {
    const value = pos.tokens * pos.current_price;
    const costBasis = pos.tokens * pos.avg_cost;
    const pnl = value - costBasis;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    return {
      tokenId: pos.token_id,
      name: pos.name,
      ticker: pos.ticker,
      emoji: pos.emoji,
      tokens: Math.round(pos.tokens * 100) / 100,
      avgCost: pos.avg_cost,
      currentPrice: pos.current_price,
      value: Math.round(value * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      pnlPercent: Math.round(pnlPercent * 10) / 10,
    };
  });

  const totalValue = holdings.reduce((acc: number, h: any) => acc + h.value, 0);
  const totalPnl = holdings.reduce((acc: number, h: any) => acc + h.pnl, 0);

  return json({
    wallet,
    holdings,
    summary: {
      totalValue: Math.round(totalValue * 100) / 100,
      totalPnl: Math.round(totalPnl * 100) / 100,
      positions: holdings.length,
    },
  });
}

// GET /api/profile/:wallet/trades - Get trade history (paginated)
export async function handleGetTradeHistory(db: any, wallet: string, url: URL) {
  if (!validWallet(wallet)) return err("invalid wallet", 400);

  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  const { results } = await db.prepare(
    `SELECT t.id, t.token_id, t.side, t.sol_amount, t.token_amount, t.price, t.ts, t.source,
            tok.name, tok.ticker, tok.emoji
     FROM trades t
     JOIN tokens tok ON t.token_id = tok.id
     WHERE t.wallet = ?
     ORDER BY t.ts DESC LIMIT ? OFFSET ?`
  ).bind(wallet, limit, offset).all();

  const countRow = await db.prepare(
    "SELECT COUNT(*) as c FROM trades WHERE wallet = ?"
  ).bind(wallet).first();

  const trades = results.map((r: any) => ({
    id: r.id,
    tokenId: r.token_id,
    name: r.name,
    ticker: r.ticker,
    emoji: r.emoji,
    side: r.side,
    solAmount: r.sol_amount,
    tokenAmount: r.token_amount,
    price: r.price,
    ts: r.ts,
    source: r.source || "demo",
  }));

  return json({
    trades,
    pagination: {
      page,
      limit,
      total: countRow.c,
      totalPages: Math.ceil(countRow.c / limit),
    },
  });
}

// GET /api/profile/:wallet/achievements - Get unlocked badges
export async function handleGetAchievements(db: any, wallet: string) {
  if (!validWallet(wallet)) return err("invalid wallet", 400);

  const { results } = await db.prepare(
    "SELECT badge_id, unlocked_at, token_id FROM achievements WHERE wallet = ? ORDER BY unlocked_at DESC"
  ).bind(wallet).all();

  // Define all possible badges
  const allBadges = [
    { id: "first_trade", name: "First Trade", description: "Complete your first trade", icon: "🎯" },
    { id: "first_create", name: "Creator", description: "Create your first token", icon: "🎨" },
    { id: "trader_10", name: "Active Trader", description: "Make 10 trades", icon: "📈" },
    { id: "trader_50", name: "Degen Trader", description: "Make 50 trades", icon: "🔥" },
    { id: "trader_100", name: "Whale", description: "Make 100 trades", icon: "🐋" },
    { id: "profit_100", name: "In The Green", description: "Reach $100 profit", icon: "💚" },
    { id: "profit_1000", name: "Profit Machine", description: "Reach $1,000 profit", icon: "💰" },
    { id: "streak_7", name: "Week Warrior", description: "7-day login streak", icon: "⚡" },
    { id: "streak_30", name: "Monthly Legend", description: "30-day login streak", icon: "🏆" },
    { id: "referral_1", name: "Recruiter", description: "Refer a friend", icon: "🤝" },
    { id: "referral_5", name: "Networker", description: "Refer 5 friends", icon: "🌐" },
    { id: "holder_24h", name: "Diamond Hands", description: "Hold a token for 24h", icon: "💎" },
    { id: "comment_10", name: "Commentator", description: "Leave 10 comments", icon: "💬" },
    { id: "like_25", name: "Appreciator", description: "Like 25 tokens", icon: "❤️" },
  ];

  const unlocked = new Set(results.map((r: any) => r.badge_id));

  return json({
    badges: allBadges.map((b: any) => ({
      ...b,
      unlocked: unlocked.has(b.id),
      unlockedAt: results.find((r: any) => r.badge_id === b.id)?.unlocked_at || null,
    })),
    unlockedCount: results.length,
    totalCount: allBadges.length,
  });
}
