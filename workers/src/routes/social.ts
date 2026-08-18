import { json, err } from '../../worker.js';

const now = () => Math.floor(Date.now() / 1000);
const validWallet = (w: string) => typeof w === "string" && /^[a-zA-Z0-9-]{3,64}$/.test(w);

// POST /api/follow/:wallet - Follow a trader
export async function handleFollow(db: any, targetWallet: string, body: any) {
  if (!validWallet(targetWallet)) return err("invalid target wallet", 400);

  const follower = body.wallet;
  if (!validWallet(follower)) return err("invalid follower wallet", 400);
  if (follower === targetWallet) return err("cannot follow yourself", 400);

  // Ensure both profiles exist
  const target = await db.prepare("SELECT wallet FROM profiles WHERE wallet = ?").bind(targetWallet).first();
  if (!target) return err("target profile not found", 404);

  const existing = await db.prepare(
    "SELECT 1 x FROM follows WHERE follower = ? AND following = ?"
  ).bind(follower, targetWallet).first();

  if (existing) return json({ ok: true, already: true });

  await db.prepare(
    "INSERT INTO follows (follower, following, created_at) VALUES (?, ?, ?)"
  ).bind(follower, targetWallet, new Date().toISOString()).run();

  return json({ ok: true, followed: true }, 201);
}

// DELETE /api/follow/:wallet - Unfollow
export async function handleUnfollow(db: any, targetWallet: string, body: any) {
  if (!validWallet(targetWallet)) return err("invalid target wallet", 400);

  const follower = body.wallet;
  if (!validWallet(follower)) return err("invalid follower wallet", 400);

  const result = await db.prepare(
    "DELETE FROM follows WHERE follower = ? AND following = ?"
  ).bind(follower, targetWallet).run();

  if (result.meta.changes === 0) return err("not following", 404);

  return json({ ok: true, unfollowed: true });
}

// GET /api/feed/:wallet - Get followed traders' activity
export async function handleGetFeed(db: any, wallet: string, url: URL) {
  if (!validWallet(wallet)) return err("invalid wallet", 400);

  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "25", 10)));

  // Get recent trades from followed wallets
  const { results } = await db.prepare(
    `SELECT t.id, t.token_id, t.wallet, t.side, t.sol_amount, t.token_amount, t.price, t.ts,
            tok.name, tok.ticker, tok.emoji
     FROM trades t
     JOIN tokens tok ON t.token_id = tok.id
     WHERE t.wallet IN (SELECT following FROM follows WHERE follower = ?)
     ORDER BY t.ts DESC LIMIT ?`
  ).bind(wallet, limit).all();

  // Get followed count and followers count
  const followingCount = await db.prepare(
    "SELECT COUNT(*) as c FROM follows WHERE follower = ?"
  ).bind(wallet).first();
  const followersCount = await db.prepare(
    "SELECT COUNT(*) as c FROM follows WHERE following = ?"
  ).bind(wallet).first();

  const activities = results.map((r: any) => ({
    type: "trade",
    wallet: r.wallet,
    tokenId: r.token_id,
    name: r.name,
    ticker: r.ticker,
    emoji: r.emoji,
    side: r.side,
    solAmount: r.sol_amount,
    tokenAmount: r.token_amount,
    price: r.price,
    ts: r.ts,
  }));

  return json({
    activities,
    stats: {
      following: followingCount.c,
      followers: followersCount.c,
    },
  });
}

// GET /api/leaderboard - Global leaderboard (XP, PnL, referrals)
export async function handleGetLeaderboard(db: any, url: URL) {
  const type = url.searchParams.get("type") || "xp"; // xp, pnl, referrals
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "25", 10)));

  let orderBy: string;
  switch (type) {
    case "pnl":
      orderBy = "pnl DESC";
      break;
    case "referrals":
      orderBy = "referral_count DESC";
      break;
    case "xp":
    default:
      orderBy = "xp DESC";
      break;
  }

  if (type === "referrals") {
    const { results } = await db.prepare(
      `SELECT p.wallet, p.xp, p.level, p.trades, p.wins, p.pnl, p.display_name,
              COUNT(r.id) as referral_count
       FROM profiles p
       LEFT JOIN referrals r ON r.referrer = p.wallet
       GROUP BY p.wallet
       ORDER BY referral_count DESC LIMIT ?`
    ).bind(limit).all();

    return json({
      type,
      leaderboard: results.map((r: any, i: number) => ({
        rank: i + 1,
        wallet: r.wallet,
        name: r.display_name || r.wallet.slice(0, 4) + "…" + r.wallet.slice(-4),
        xp: r.xp,
        level: r.level,
        trades: r.trades,
        winRate: r.trades > 0 ? Math.round((r.wins / r.trades) * 100) : 0,
        pnl: Math.round(r.pnl * 100) / 100,
        referrals: r.referral_count,
      })),
    });
  }

  const { results } = await db.prepare(
    `SELECT wallet, xp, level, trades, wins, pnl, display_name
     FROM profiles ORDER BY ${orderBy} LIMIT ?`
  ).bind(limit).all();

  return json({
    type,
    leaderboard: results.map((r: any, i: number) => ({
      rank: i + 1,
      wallet: r.wallet,
      name: r.display_name || r.wallet.slice(0, 4) + "…" + r.wallet.slice(-4),
      xp: r.xp,
      level: r.level,
      trades: r.trades,
      winRate: r.trades > 0 ? Math.round((r.wins / r.trades) * 100) : 0,
      pnl: Math.round(r.pnl * 100) / 100,
    })),
  });
}

// GET /api/profile/:wallet/followers - Get followers list
export async function handleGetFollowers(db: any, wallet: string) {
  if (!validWallet(wallet)) return err("invalid wallet", 400);

  const { results } = await db.prepare(
    `SELECT f.follower, f.created_at, p.xp, p.level, p.display_name
     FROM follows f
     JOIN profiles p ON f.follower = p.wallet
     WHERE f.following = ?
     ORDER BY f.created_at DESC LIMIT 50`
  ).bind(wallet).all();

  return json({
    followers: results.map((r: any) => ({
      wallet: r.follower,
      name: r.display_name || r.follower.slice(0, 4) + "…" + r.follower.slice(-4),
      xp: r.xp,
      level: r.level,
      followedAt: r.created_at,
    })),
    count: results.length,
  });
}

// GET /api/profile/:wallet/following - Get following list
export async function handleGetFollowing(db: any, wallet: string) {
  if (!validWallet(wallet)) return err("invalid wallet", 400);

  const { results } = await db.prepare(
    `SELECT f.following, f.created_at, p.xp, p.level, p.display_name
     FROM follows f
     JOIN profiles p ON f.following = p.wallet
     WHERE f.follower = ?
     ORDER BY f.created_at DESC LIMIT 50`
  ).bind(wallet).all();

  return json({
    following: results.map((r: any) => ({
      wallet: r.following,
      name: r.display_name || r.following.slice(0, 4) + "…" + r.following.slice(-4),
      xp: r.xp,
      level: r.level,
      followedAt: r.created_at,
    })),
    count: results.length,
  });
}
