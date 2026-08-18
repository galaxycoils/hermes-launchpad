import { json, err } from '../../worker.js';

const now = () => Math.floor(Date.now() / 1000);
const validWallet = (w: string) => typeof w === "string" && /^[a-zA-Z0-9-]{3,64}$/.test(w);
const levelFor = (xp: number) => Math.floor(Math.sqrt(xp / 250)) + 1;

// Generate a short referral code
function generateRefCode(): string {
  const chars = "abcdefghijkmnopqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET /api/referrals/:wallet - Get referral stats
export async function handleGetReferrals(db: any, wallet: string) {
  if (!validWallet(wallet)) return err("invalid wallet", 400);

  // Ensure profile exists
  let p = await db.prepare("SELECT * FROM profiles WHERE wallet = ?").bind(wallet).first();
  if (!p) {
    const refCode = generateRefCode();
    await db.prepare(
      "INSERT INTO profiles (wallet, xp, level, ref_code, created_at) VALUES (?, 0, 1, ?, ?)"
    ).bind(wallet, refCode, now()).run();
    p = { wallet, xp: 0, level: 1, ref_code: refCode };
  }

  // Get referred users
  const { results: referred } = await db.prepare(
    `SELECT p.wallet, p.xp, p.level, p.created_at, r.total_fees_generated, r.total_credits
     FROM profiles p
     LEFT JOIN referrals r ON r.referee = p.wallet
     WHERE p.referred_by = ? OR p.referred_by = ?
     ORDER BY p.created_at DESC LIMIT 50`
  ).bind(wallet, p.ref_code).all();

  // Get referral stats
  const totalReferred = referred.length;
  const totalFees = referred.reduce((acc: number, r: any) => acc + (r.total_fees_generated || 0), 0);
  const totalCredits = referred.reduce((acc: number, r: any) => acc + (r.total_credits || 0), 0);
  const xpEarned = totalReferred * 750;

  // Get referral rank (top referrers)
  const { results: topReferrers } = await db.prepare(
    `SELECT wallet, COUNT(*) as ref_count FROM (
       SELECT wallet FROM profiles WHERE referred_by IS NOT NULL
     ) GROUP BY referred_by ORDER BY ref_count DESC LIMIT 100`
  ).all();

  const myRank = topReferrers.findIndex((r: any) => r.wallet === wallet) + 1;

  return json({
    code: p.ref_code,
    link: `https://hermes.launchpad/?ref=${p.ref_code}`,
    stats: {
      totalReferred,
      totalFeesGenerated: Math.round(totalFees * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      xpEarned,
      xpPerReferral: 750,
      rank: myRank > 0 ? myRank : null,
    },
    referred: referred.map((r: any) => ({
      wallet: r.wallet,
      name: r.wallet.slice(0, 4) + "…" + r.wallet.slice(-4),
      xp: r.xp,
      level: r.level,
      feesGenerated: r.total_fees_generated || 0,
      credits: r.total_credits || 0,
      joinedAt: r.created_at,
    })),
  });
}

// POST /api/referrals/validate - Validate referral code
export async function handleValidateReferral(db: any, body: any) {
  const code = body.code;
  if (!code || typeof code !== "string") return err("referral code required", 400);

  const trimmedCode = code.trim().toLowerCase();
  if (trimmedCode.length < 3 || trimmedCode.length > 32) return err("invalid code format", 400);

  // Look up by ref_code or wallet
  const referrer = await db.prepare(
    "SELECT wallet, xp, level, ref_code FROM profiles WHERE ref_code = ? OR wallet = ?"
  ).bind(trimmedCode, trimmedCode).first();

  if (!referrer) return err("invalid referral code", 404);

  return json({
    valid: true,
    referrer: referrer.wallet,
    name: referrer.wallet.slice(0, 4) + "…" + referrer.wallet.slice(-4),
    xp: referrer.xp,
    level: referrer.level,
    code: referrer.ref_code,
  });
}

// POST /api/referrals/apply - Apply a referral code to a wallet
export async function handleApplyReferral(db: any, body: any) {
  const wallet = body.wallet;
  const code = body.code;

  if (!validWallet(wallet)) return err("valid wallet required", 400);
  if (!code || typeof code !== "string") return err("referral code required", 400);

  // Check if wallet already has a referrer
  let p = await db.prepare("SELECT * FROM profiles WHERE wallet = ?").bind(wallet).first();
  if (p?.referred_by) return err("referral already applied", 409);

  // Find referrer
  const referrer = await db.prepare(
    "SELECT wallet, ref_code FROM profiles WHERE ref_code = ? OR wallet = ?"
  ).bind(code.trim().toLowerCase(), code.trim().toLowerCase()).first();

  if (!referrer) return err("invalid referral code", 404);
  if (referrer.wallet === wallet) return err("cannot refer yourself", 400);

  // Apply referral
  const refCode = p?.ref_code || generateRefCode();
  if (!p) {
    await db.prepare(
      "INSERT INTO profiles (wallet, xp, level, ref_code, referred_by, created_at) VALUES (?, 0, 1, ?, ?, ?)"
    ).bind(wallet, refCode, referrer.wallet, now()).run();
  } else {
    await db.prepare(
      "UPDATE profiles SET referred_by = ? WHERE wallet = ?"
    ).bind(referrer.wallet, wallet).run();
  }

  // Create referral record
  await db.prepare(
    "INSERT OR IGNORE INTO referrals (referrer, referee, created_at) VALUES (?, ?, ?)"
  ).bind(referrer.wallet, wallet, new Date().toISOString()).run();

  // Award referrer XP
  const referrerProfile = await db.prepare(
    "SELECT xp, level FROM profiles WHERE wallet = ?"
  ).bind(referrer.wallet).first();

  if (referrerProfile) {
    const newXp = referrerProfile.xp + 750;
    const newLevel = levelFor(newXp);
    await db.prepare("UPDATE profiles SET xp = ?, level = ? WHERE wallet = ?")
      .bind(newXp, newLevel, referrer.wallet).run();
  }

  return json({
    ok: true,
    referrer: referrer.wallet,
    xpGained: 750,
  }, 201);
}

// GET /api/referrals/leaderboard - Top referrers
export async function handleGetReferralLeaderboard(db: any) {
  const { results } = await db.prepare(
    `SELECT p.wallet, p.xp, p.level, p.display_name, COUNT(r.id) as ref_count
     FROM profiles p
     JOIN referrals r ON r.referrer = p.wallet
     GROUP BY p.wallet
     ORDER BY ref_count DESC LIMIT 25`
  ).all();

  return json({
    leaderboard: results.map((r: any, i: number) => ({
      rank: i + 1,
      wallet: r.wallet,
      name: r.display_name || r.wallet.slice(0, 4) + "…" + r.wallet.slice(-4),
      xp: r.xp,
      level: r.level,
      referrals: r.ref_count,
    })),
  });
}
