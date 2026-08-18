import nacl from 'tweetnacl';
import { verifyCreateTransaction, verifyTradeTransaction, fetchCurveState } from "./chain.js";
import { WebSocketHub } from "./src/do/websocket.js";
import { handleGetProfile, handleUpdateProfile, handleGetPortfolio, handleGetTradeHistory, handleGetAchievements } from "./src/routes/profile.js";
import { handleFollow, handleUnfollow, handleGetFeed, handleGetLeaderboard, handleGetFollowers, handleGetFollowing } from "./src/routes/social.js";
import { handleCheckin, handleGetQuests, handleClaimQuest } from "./src/routes/quests.js";
import { handleGetReferrals, handleValidateReferral, handleApplyReferral, handleGetReferralLeaderboard } from "./src/routes/referrals.js";

// hermes-api v2 — Hermes Launchpad backend
// Shared bonding-curve engine (mirrors programs/hermes-curve math) + trades,
// comments, likes, profiles/XP/quests/streaks, referrals, and Workers AI agents.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Wallet-Signature, Wallet-Nonce",
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...cors } });
const err = (msg, status = 400) => json({ error: msg }, status);

// ---- Web3 signature auth ----
// Challenges are single-use nonces stored for 5 min to prevent replay attacks.
const challengeStore = new Map(); // nonce -> { wallet, expires }
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

function generateNonce() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Minimal base58 decode for Solana pubkeys
const B58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function bs58Decode(str) {
  let n = BigInt(0);
  for (const ch of str) {
    const idx = B58_ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error('invalid b58');
    n = n * BigInt(58) + BigInt(idx);
  }
  const hex = n.toString(16);
  const padded = hex.length % 2 ? '0' + hex : hex;
  const bytes = new Uint8Array(padded.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(padded.substr(i * 2, 2), 16);
  }
  const out = new Uint8Array(32);
  out.set(bytes, 32 - bytes.length);
  return out;
}

/** Verify an Ed25519 detached signature over the challenge message. */
function verifySignature(message, signatureB64, walletB58) {
  try {
    const msgBytes = new TextEncoder().encode(message);
    const sigBytes = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
    const pubkeyBytes = bs58Decode(walletB58);
    if (pubkeyBytes.length !== 32) return false;
    return nacl.sign.detached.verify(msgBytes, sigBytes, pubkeyBytes);
  } catch {
    return false;
  }
}

/** Verify auth headers for protected mutations. Returns wallet or null. */
function verifyAuth(request) {
  const sig = request.headers.get('Wallet-Signature');
  const nonce = request.headers.get('Wallet-Nonce');
  if (!sig || !nonce) return null;
  const entry = challengeStore.get(nonce);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    challengeStore.delete(nonce);
    return null;
  }
  challengeStore.delete(nonce); // single-use
  const msg = `Hermes Launchpad auth challenge: ${nonce}`;
  if (!verifySignature(msg, sig, entry.wallet)) return null;
  return entry.wallet;
}

// Periodic cleanup is handled by TTL checks in verifyAuth; no setInterval in global scope (CF Worker constraint)

// ---- Curve constants (mirror on-chain program) ----
// eslint-disable-next-line no-unused-vars
const V_SOL0 = 30;             // 30 SOL virtual — virtual SOL reserves at curve start
// eslint-disable-next-line no-unused-vars
const V_TOK0 = 1.073e9;        // 1.073B tokens virtual — virtual token reserves at curve start
const SUPPLY = 1e9;            // 1B tokens
const MIGRATION_SOL = 85;      // graduate at 85 SOL raised
const FEE = 0.005;             // 0.5% total on-chain (0.25 platform + 0.25 creator)
const SOL_USD = 150;           // display peg (demo)
const MAX_TRADE_FRAC = 0.10;   // anti-whale: max 10% of virtual reserves per trade
const AI_MODEL = "@cf/meta/llama-3.1-8b-fast-v2";
const CURVE_CACHE_TTL_MS = 20_000;
const CURVE_CACHE_MAX = 200;
const curveStateCache = new Map();
const HELIUS_DEVNET_RPC = "https://devnet.helius-rpc.com/?api-key=d2891b4a-5a20-48ea-9ce1-046c2b899bbe";
const getRpcUrl = (env) => env.SOLANA_RPC || HELIUS_DEVNET_RPC;


const QUESTS = [
  { id: "q1", title: "Make 3 trades today", xp: 500, total: 3 },
  { id: "q2", title: "Create a token", xp: 1000, total: 1 },
  { id: "q3", title: "Comment on 2 tokens", xp: 300, total: 2 },
  { id: "q4", title: "Like 3 tokens", xp: 200, total: 3 },
];
const XP = { trade: 100, create: 1000, comment: 25, like: 5, daily: 50, refer: 750, questBonus: 1 };

const today = () => new Date().toISOString().slice(0, 10);
const now = () => Math.floor(Date.now() / 1000);
const levelFor = (xp) => Math.floor(Math.sqrt(xp / 250)) + 1;
const shortRef = () => Math.random().toString(36).slice(2, 8);
const validWallet = (w) => typeof w === "string" && /^[a-zA-Z0-9-]{3,64}$/.test(w);

function priceSol(t) { return t.virtual_sol / t.virtual_tokens; }
function curveProgress(t) { return Math.min(100, (t.real_sol / MIGRATION_SOL) * 100); }

function mapToken(t, onchain) {
  const spark = JSON.parse(t.spark || "[]");
  const change = spark.length > 1 ? ((spark[spark.length - 1] - spark[0]) / Math.max(1e-9, spark[0])) * 100 : 0;
  // Prefer on-chain decoded values when available (provenance: chain decode).
  const vs = onchain?.virtualSol ?? t.virtual_sol;
  const vt = onchain?.virtualTokens ?? t.virtual_tokens;
  const priceSolVal = vt > 0 ? vs / vt : priceSol(t);
  const realSol = onchain ? onchain.realSol : Math.round(t.real_sol * 100) / 100;
  const complete = onchain ? onchain.complete : Boolean(t.complete);
  return {
    id: t.id, name: t.name, ticker: t.ticker, emoji: t.emoji, lore: t.lore,
    creator: t.creator, chain: t.chain,
    marketCap: Math.round(priceSolVal * SUPPLY * SOL_USD),
    price: priceSolVal * SOL_USD,
    priceSol: priceSolVal,
    change24h: Math.round(change * 10) / 10,
    volume24h: Math.round(t.volume_24h), holders: t.holders,
    curveProgress: Math.round(curveProgress({ ...t, real_sol: realSol }) * 10) / 10,
    replies: t.replies, likes: t.likes, riskScore: t.risk_score,
    riskFlag: t.risk_flag || undefined,
    sentiment: t.sentiment, spark,
    createdMinsAgo: Math.max(0, Math.floor((now() - t.created_at) / 60)),
    onchainMint: t.onchain_mint || undefined,
    provenance: t.onchain_mint ? (onchain ? "onchain" : "index") : "demo",
    complete,
    realSol: Math.round(realSol * 100) / 100,
  };
}

async function cachedCurveState({ mint, programId, rpcUrl }) {
  const cached = curveStateCache.get(mint);
  if (cached && Date.now() - cached.ts < CURVE_CACHE_TTL_MS) return cached.state;
  const state = await fetchCurveState({ mint, programId, rpcUrl });
  curveStateCache.delete(mint);
  curveStateCache.set(mint, { ts: Date.now(), state });
  while (curveStateCache.size > CURVE_CACHE_MAX) {
    curveStateCache.delete(curveStateCache.keys().next().value);
  }
  return state;
}

async function getToken(db, id) {
  return db.prepare("SELECT * FROM tokens WHERE id = ?").bind(id).first();
}

async function refreshStats(db, t) {
  // volume + holders from last 24h, spark append, sentiment from price action
  const day_ago = now() - 86400;
  const vol = await db.prepare(
    "SELECT COALESCE(SUM(sol_amount),0) v FROM trades WHERE token_id = ? AND ts > ?"
  ).bind(t.id, day_ago).first();
  const holders = await db.prepare(
    "SELECT COUNT(*) c FROM positions WHERE token_id = ? AND tokens > 0.000001"
  ).bind(t.id).first();
  const spark = JSON.parse(t.spark || "[]");
  spark.push(Math.round(priceSol(t) * 1e12) / 1e6); // store micro-USD-ish shape
  while (spark.length > 24) spark.shift();
  const change = spark.length > 1 ? spark[spark.length - 1] - spark[0] : 0;
  const sentiment = change > 0.5 ? "bullish" : change < -0.5 ? "bearish" : "neutral";
  await db.prepare(
    "UPDATE tokens SET volume_24h = ?, holders = ?, spark = ?, sentiment = ?, price = ? WHERE id = ?"
  ).bind(vol.v * SOL_USD, Math.max(1, holders.c), JSON.stringify(spark), sentiment, priceSol(t), t.id).run();
}

async function awardXp(db, wallet, amount, questId) {
  let p = await db.prepare("SELECT * FROM profiles WHERE wallet = ?").bind(wallet).first();
  if (!p) {
    await db.prepare(
      "INSERT INTO profiles (wallet, xp, level, ref_code, created_at) VALUES (?, 0, 1, ?, ?)"
    ).bind(wallet, shortRef(), now()).run();
    p = { wallet, xp: 0, level: 1 };
  }
  const xp = p.xp + amount;
  const level = levelFor(xp);
  await db.prepare("UPDATE profiles SET xp = ?, level = ? WHERE wallet = ?").bind(xp, level, wallet).run();
  if (questId) {
    const d = today();
    await db.prepare(
      `INSERT INTO quest_progress (wallet, quest_id, progress, done, day) VALUES (?, ?, 1, 0, ?)
       ON CONFLICT(wallet, quest_id, day) DO UPDATE SET progress = progress + 1`
    ).bind(wallet, questId, d).run();
    const q = QUESTS.find((q) => q.id === questId);
    const qp = await db.prepare(
      "SELECT progress, done FROM quest_progress WHERE wallet = ? AND quest_id = ? AND day = ?"
    ).bind(wallet, questId, d).first();
    if (q && qp && qp.progress >= q.total && !qp.done) {
      await db.prepare(
        "UPDATE quest_progress SET done = 1 WHERE wallet = ? AND quest_id = ? AND day = ?"
      ).bind(wallet, questId, d).run();
      const xp2 = xp + q.xp;
      await db.prepare("UPDATE profiles SET xp = ?, level = ? WHERE wallet = ?")
        .bind(xp2, levelFor(xp2), wallet).run();
      return { xpGained: amount + q.xp, questCompleted: q };
    }
  }
  return { xpGained: amount, questCompleted: null };
}

async function ensureProfile(db, wallet, referredBy) {
  let p = await db.prepare("SELECT * FROM profiles WHERE wallet = ?").bind(wallet).first();
  if (p) return { profile: p, created: false };
  await db.prepare(
    "INSERT INTO profiles (wallet, xp, level, ref_code, referred_by, created_at) VALUES (?, 0, 1, ?, ?, ?)"
  ).bind(wallet, shortRef(), referredBy || null, now()).run();
  if (referredBy && validWallet(referredBy) && referredBy !== wallet) {
    const ref = await db.prepare("SELECT wallet FROM profiles WHERE ref_code = ? OR wallet = ?")
      .bind(referredBy, referredBy).first();
    if (ref) await awardXp(db, ref.wallet, XP.refer, null);
  }
  p = await db.prepare("SELECT * FROM profiles WHERE wallet = ?").bind(wallet).first();
  return { profile: p, created: true };
}

async function callAi(env, system, user) {
  const res = await env.AI.run(AI_MODEL, {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_tokens: 220,
  });
  const r = res && res.response;
  if (!r) return "";
  return typeof r === "string" ? r.trim() : JSON.stringify(r);
}

export { WebSocketHub, json, err };

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(request.url);
    const path = url.pathname;
    const db = env.DB;

    try {
      // ---------- health ----------
      if (path === "/api/health") return json({ ok: true, v: 2, ts: now() });

      // ---------- wallet auth challenge ----------
      // POST /api/auth/challenge { wallet } -> { nonce }
      // Client signs `Hermes Launchpad auth challenge: <nonce>` and sends signature + nonce in headers
      if (path === "/api/auth/challenge" && request.method === "POST") {
        const b = await request.json().catch(() => ({}));
        if (!validWallet(b.wallet)) return err("valid wallet required");
        const nonce = generateNonce();
        challengeStore.set(nonce, { wallet: b.wallet, expires: Date.now() + CHALLENGE_TTL_MS });
        return json({ nonce, message: `Hermes Launchpad auth challenge: ${nonce}` });
      }

      // ---------- tokens ----------
      if (path === "/api/tokens" && request.method === "GET") {
        const { results } = await db.prepare("SELECT * FROM tokens ORDER BY created_at ASC").all();
        const enriched = await Promise.all(results.map(async (t) => {
          let onchain = null;
          if (t.onchain_mint && env.PROGRAM_ID) {
            onchain = await cachedCurveState({ mint: t.onchain_mint, programId: env.PROGRAM_ID, rpcUrl: getRpcUrl(env) });
          }
          return mapToken(t, onchain);
        }));
        return json(enriched);
      }

      if (path === "/api/tokens/index" && request.method === "POST") {
        const b = await request.json().catch(() => ({}));
        const name = typeof b.name === "string" ? b.name.trim().slice(0, 32) : "";
        const ticker = typeof b.ticker === "string" ? b.ticker.trim().toUpperCase().slice(0, 10) : "";
        const emoji = typeof b.emoji === "string" ? b.emoji.slice(0, 16) : "🪙";
        const { mint, signature, creator } = b;
        if (!name || !ticker || !mint || !signature || !creator) {
          return err("name, ticker, emoji, mint, signature, and creator required");
        }
        const verified = await verifyCreateTransaction({
          signature, mint, creator, programId: env.PROGRAM_ID, rpcUrl: getRpcUrl(env),
        });
        if (!verified) return err("unverified on-chain create transaction", 403);
        const existing = await db.prepare("SELECT id FROM tokens WHERE onchain_mint = ?").bind(mint).first();
        if (existing) return json({ ok: true, already: true, id: existing.id, onchainMint: mint, provenance: "onchain" });
        const onchain = await fetchCurveState({ mint, programId: env.PROGRAM_ID, rpcUrl: getRpcUrl(env) });
        const id = `${ticker.toLowerCase()}-${signature.slice(0, 4)}`;
        await db.prepare(
          "INSERT INTO tokens (id, name, ticker, emoji, lore, creator, chain, onchain_mint, real_sol, complete, created_at) VALUES (?, ?, ?, ?, '', ?, 'SOL', ?, ?, ?, ?)"
        ).bind(id, name, ticker, emoji, verified.creator, mint, onchain?.realSol ?? 0, onchain?.complete ? 1 : 0, now()).run();
        return json({
          ok: true, id, onchainMint: mint, provenance: "onchain",
          realSol: onchain?.realSol ?? 0, complete: onchain?.complete ?? false,
        }, 201);
      }

      const tokenMatch = path.match(/^\/api\/tokens\/([a-zA-Z0-9-]+)(\/(comments|like|lore|risk))?$/);

      if (tokenMatch && !tokenMatch[2] && request.method === "GET") {
        const t = await getToken(db, tokenMatch[1]);
        if (!t) return err("not found", 404);
        const w = url.searchParams.get("wallet");
        let likedByMe = false;
        if (w && validWallet(w)) {
          const l = await db.prepare("SELECT 1 x FROM likes WHERE token_id = ? AND wallet = ?").bind(t.id, w).first();
          likedByMe = Boolean(l);
        }
        let onchain = null;
        if (t.onchain_mint && env.PROGRAM_ID) {
          onchain = await cachedCurveState({ mint: t.onchain_mint, programId: env.PROGRAM_ID, rpcUrl: getRpcUrl(env) });
        }
        return json({ ...mapToken(t, onchain), likedByMe });
      }

      // ---------- comments ----------
      if (tokenMatch && tokenMatch[3] === "comments") {
        const id = tokenMatch[1];
        if (request.method === "GET") {
          const { results } = await db.prepare(
            "SELECT wallet, text, ts FROM comments WHERE token_id = ? ORDER BY ts DESC LIMIT 50"
          ).bind(id).all();
          return json(results);
        }
        const b = await request.json().catch(() => ({}));
        const authWallet = verifyAuth(request);
        const wallet = authWallet || b.wallet;
        if (!validWallet(wallet) || !b.text || !String(b.text).trim()) return err("wallet + text required");
        if (!authWallet) return err("sign the challenge to post (Wallet-Signature header)", 401);
        const text = String(b.text).slice(0, 280);
        await db.prepare("INSERT INTO comments (token_id, wallet, text, ts) VALUES (?, ?, ?, ?)")
          .bind(id, wallet, text, now()).run();
        await db.prepare("UPDATE tokens SET replies = replies + 1 WHERE id = ?").bind(id).run();
        await ensureProfile(db, wallet);
        const xp = await awardXp(db, wallet, XP.comment, "q3");
        return json({ ok: true, ...xp }, 201);
      }

      // ---------- likes ----------
      if (tokenMatch && tokenMatch[3] === "like" && request.method === "POST") {
        const id = tokenMatch[1];
        const authWallet = verifyAuth(request);
        if (!authWallet) return err("sign the challenge to like (Wallet-Signature header)", 401);
        const ins = await db.prepare("INSERT OR IGNORE INTO likes (token_id, wallet, ts) VALUES (?, ?, ?)")
          .bind(id, authWallet, now()).run();
        if (ins.meta.changes > 0) {
          await db.prepare("UPDATE tokens SET likes = likes + 1 WHERE id = ?").bind(id).run();
          await ensureProfile(db, authWallet);
          const xp = await awardXp(db, authWallet, XP.like, "q4");
          return json({ ok: true, liked: true, ...xp });
        }
        return json({ ok: true, liked: false, xpGained: 0 });
      }

      // ---------- AI: The Bard (lore) ----------
      if (tokenMatch && tokenMatch[3] === "lore" && request.method === "POST") {
        const t = await getToken(db, tokenMatch[1]);
        if (!t) return err("not found", 404);
        const lore = await callAi(env,
          "You are The Bard, a memecoin lore writer. Write punchy, funny, degen lore for a token. Max 2 sentences. No hashtags, no disclaimers, no financial advice.",
          `Token: ${t.name} ($${t.ticker}). Current lore: ${t.lore || "none"}. Write fresh lore.`);
        if (lore) await db.prepare("UPDATE tokens SET lore = ? WHERE id = ?").bind(lore.slice(0, 300), t.id).run();
        return json({ lore: lore || t.lore, agent: "The Bard" });
      }

      // ---------- AI: The Oracle (risk) ----------
      if (tokenMatch && tokenMatch[3] === "risk" && request.method === "POST") {
        const t = await getToken(db, tokenMatch[1]);
        if (!t) return err("not found", 404);
        const stats = `mcap $${Math.round(priceSol(t) * SUPPLY * SOL_USD)}, holders ${t.holders}, curve ${Math.round(curveProgress(t))}%, vol24h $${Math.round(t.volume_24h)}, replies ${t.replies}`;
        const out = await callAi(env,
          "You are The Oracle, a memecoin risk analyst. Reply with ONLY a JSON object: {\"score\": <0-100 integer, 100=extreme risk>, \"flag\": \"<one short phrase>\"}. Base it on the stats: low mcap + low holders = higher risk.",
          `Token ${t.name} ($${t.ticker}): ${stats}`);
        let score = t.risk_score, flag = "no data";
        const m = out.match(/\{[^}]*\}/);
        if (m) {
          try {
            const parsed = JSON.parse(m[0]);
            if (Number.isFinite(parsed.score)) score = Math.max(0, Math.min(100, Math.round(parsed.score)));
            if (parsed.flag) flag = String(parsed.flag).slice(0, 80);
          } catch { /* keep defaults */ }
        }
        await db.prepare("UPDATE tokens SET risk_score = ?, risk_flag = ? WHERE id = ?").bind(score, flag, t.id).run();
        return json({ score, flag, agent: "The Oracle" });
      }

      // ---------- trades ----------
      if (path === "/api/trades" && request.method === "GET") {
        const tokenId = url.searchParams.get("token_id");
        const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "25", 10));
        const q = tokenId
          ? db.prepare("SELECT * FROM trades WHERE token_id = ? ORDER BY ts DESC LIMIT ?").bind(tokenId, limit)
          : db.prepare("SELECT * FROM trades ORDER BY ts DESC LIMIT ?").bind(limit);
        const { results } = await q.all();
        return json(results);
      }

      if (path === "/api/trades" && request.method === "POST") {
        const b = await request.json().catch(() => ({}));
        const { token_id, wallet, side } = b;
        const amount = Number(b.amount);
        if (!validWallet(wallet) || !["buy", "sell"].includes(side) || !(amount > 0)) {
          return err("token_id, wallet, side, positive amount required");
        }
        const t = await getToken(db, token_id);
        if (!t) return err("token not found", 404);
        if (t.complete) return err("token migration-ready — curve closed", 409);

        // Demo mode: if DEMO_OFFCHAIN_CURVE is not true, reject unsigned trades
        if (env.DEMO_OFFCHAIN_CURVE !== "true") {
          return err("off-chain trades disabled — use on-chain flow", 403);
        }

        let vs = t.virtual_sol, vt = t.virtual_tokens, realSol = t.real_sol;
        let solAmt = 0, tokAmt = 0;

        if (side === "buy") {
          const solIn = Math.min(amount, vs * MAX_TRADE_FRAC);
          const eff = solIn * (1 - FEE);
          tokAmt = (vt * eff) / (vs + eff);
          vs += eff; vt -= tokAmt; realSol += solIn; solAmt = solIn;
        } else {
          const pos = await db.prepare("SELECT tokens FROM positions WHERE wallet = ? AND token_id = ?")
            .bind(wallet, token_id).first();
          const held = pos ? pos.tokens : 0;
          const tokIn = Math.min(amount, held);
          if (tokIn <= 0) return err("nothing to sell", 409);
          const gross = (vs * tokIn) / (vt + tokIn);
          solAmt = gross * (1 - FEE);
          tokAmt = tokIn;
          vs -= gross; vt += tokIn; realSol = Math.max(0, realSol - gross);
        }

        const complete = realSol >= MIGRATION_SOL ? 1 : 0;
        const execPrice = side === "buy" ? solAmt / tokAmt : solAmt / tokAmt; // SOL per token

        await db.prepare(
          "UPDATE tokens SET virtual_sol = ?, virtual_tokens = ?, real_sol = ?, price = ?, complete = ? WHERE id = ?"
        ).bind(vs, vt, realSol, vs / vt, complete, token_id).run();
        await db.prepare(
          "INSERT INTO trades (token_id, wallet, side, sol_amount, token_amount, price, ts) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(token_id, wallet, side, solAmt, tokAmt, execPrice, now()).run();

        // positions + pnl
        let pnlDelta = 0, win = 0;
        if (side === "buy") {
          await db.prepare(
            `INSERT INTO positions (wallet, token_id, tokens, avg_cost) VALUES (?, ?, ?, ?)
             ON CONFLICT(wallet, token_id) DO UPDATE SET
               avg_cost = (avg_cost * tokens + excluded.avg_cost * excluded.tokens) / (tokens + excluded.tokens),
               tokens = tokens + excluded.tokens`
          ).bind(wallet, token_id, tokAmt, execPrice).run();
        } else {
          const pos = await db.prepare("SELECT tokens, avg_cost FROM positions WHERE wallet = ? AND token_id = ?")
            .bind(wallet, token_id).first();
          if (pos) {
            pnlDelta = (execPrice - pos.avg_cost) * tokAmt * SOL_USD;
            win = execPrice > pos.avg_cost ? 1 : 0;
            await db.prepare("UPDATE positions SET tokens = MAX(0, tokens - ?) WHERE wallet = ? AND token_id = ?")
              .bind(tokAmt, wallet, token_id).run();
          }
        }

        await ensureProfile(db, wallet);
        await db.prepare("UPDATE profiles SET trades = trades + 1, wins = wins + ?, pnl = pnl + ? WHERE wallet = ?")
          .bind(win, pnlDelta, wallet).run();
        const xp = await awardXp(db, wallet, XP.trade, "q1");

        const t2 = await getToken(db, token_id);
        await refreshStats(db, t2);
        const t3 = await getToken(db, token_id);
        let onchain = null;
        if (t3.onchain_mint && env.PROGRAM_ID) {
          onchain = await fetchCurveState({ mint: t3.onchain_mint, programId: env.PROGRAM_ID, rpcUrl: getRpcUrl(env) });
        }
        return json({
          ok: true, side, solAmount: solAmt, tokenAmount: tokAmt, price: execPrice,
          pnl: Math.round(pnlDelta * 100) / 100,
          migrationReady: Boolean(complete),
          token: mapToken(t3, onchain), ...xp,
        });
      }

      // ---- on-chain trade indexing ----
      if (path === "/api/trades/index" && request.method === "POST") {
        const b = await request.json().catch(() => ({}));
        const { mint, signature, side, wallet } = b;
        if (!mint || !signature || !wallet || !["buy", "sell"].includes(side)) {
          return err("mint, signature, wallet, and buy/sell side required");
        }
        const verified = await verifyTradeTransaction({
          signature, mint, wallet, side, programId: env.PROGRAM_ID, rpcUrl: getRpcUrl(env),
        });
        if (!verified) return err("unverified on-chain trade transaction", 403);
        const existing = await db.prepare("SELECT 1 x FROM trades WHERE signature = ?").bind(signature).first();
        if (existing) return json({ ok: true, already: true });
        
        // Get token by onchain_mint
        const t = await db.prepare("SELECT * FROM tokens WHERE onchain_mint = ?").bind(mint).first();
        if (!t) return err("token not found for mint", 404);
        
        // Record trade with signature (amounts are 0 since on-chain is source of truth)
        await db.prepare(
          "INSERT INTO trades (token_id, wallet, side, sol_amount, token_amount, price, ts, signature, source) VALUES (?, ?, ?, 0, 0, 0, ?, ?, 'onchain')"
        ).bind(t.id, verified.wallet, side, now(), signature).run();
        
        if (validWallet(verified.wallet)) {
          await ensureProfile(db, verified.wallet);
          await db.prepare("UPDATE profiles SET trades = trades + 1 WHERE wallet = ?").bind(verified.wallet).run();
          const xp = await awardXp(db, verified.wallet, XP.trade, "q1");
          return json({ ok: true, ...xp });
        }
        return json({ ok: true });
      }

      // ---------- profiles / quests / check-in ----------
      const profMatch = path.match(/^\/api\/profile\/([a-zA-Z0-9-]+)(\/(checkin|referrals))?$/);
      if (profMatch && !profMatch[2] && request.method === "GET") {
        const wallet = profMatch[1];
        if (!validWallet(wallet)) return err("bad wallet");
        const ref = url.searchParams.get("ref");
        const { profile } = await ensureProfile(db, wallet, ref);
        return json(profile);
      }
      if (profMatch && profMatch[2] === "/checkin" && request.method === "POST") {
        const wallet = profMatch[1];
        if (!validWallet(wallet)) return err("bad wallet");
        const { profile: p } = await ensureProfile(db, wallet);
        const d = today();
        if (p.last_active_day === d) return json({ ok: true, already: true, streak: p.streak_days, xpGained: 0 });
        const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
        const streak = p.last_active_day === yesterday ? p.streak_days + 1 : 1;
        const bonus = streak >= 7 ? 2 : 1;
        await db.prepare("UPDATE profiles SET streak_days = ?, last_active_day = ? WHERE wallet = ?")
          .bind(streak, d, wallet).run();
        const xp = await awardXp(db, wallet, XP.daily * bonus, null);
        return json({ ok: true, streak, multiplier: bonus, ...xp });
      }

      if (profMatch && profMatch[3] === "referrals" && request.method === "GET") {
        const wallet = profMatch[1];
        if (!validWallet(wallet)) return err("bad wallet");
        const { profile: p } = await ensureProfile(db, wallet);
        const { results } = await db.prepare(
          "SELECT wallet, created_at FROM profiles WHERE referred_by = ? OR referred_by = ? ORDER BY created_at DESC LIMIT 50"
        ).bind(wallet, p.ref_code).all();
        return json({
          code: p.ref_code,
          invites: results.length,
          xpEarned: results.length * XP.refer,
          xpPerInvite: XP.refer,
          referred: results.map((r) => ({
            name: r.wallet.slice(0, 4) + "…" + r.wallet.slice(-4),
            ts: r.created_at,
          })),
        });
      }

      if (path === "/api/quests" && request.method === "GET") {
        const wallet = url.searchParams.get("wallet");
        const d = today();
        let prog = {};
        if (wallet && validWallet(wallet)) {
          const { results } = await db.prepare(
            "SELECT quest_id, progress, done FROM quest_progress WHERE wallet = ? AND day = ?"
          ).bind(wallet, d).all();
          prog = Object.fromEntries(results.map((r) => [r.quest_id, r]));
        }
        return json(QUESTS.map((q) => ({
          ...q,
          progress: Math.min(q.total, prog[q.id]?.progress || 0),
          done: Boolean(prog[q.id]?.done),
        })));
      }



      if (path === "/api/stats") {
        const tokens = await db.prepare("SELECT COUNT(*) c FROM tokens").first();
        const trades = await db.prepare("SELECT COUNT(*) c, COALESCE(SUM(sol_amount),0) v FROM trades").first();
        const profiles = await db.prepare("SELECT COUNT(*) c FROM profiles").first();
        return json({
          tokens: tokens.c, trades: trades.c,
          volumeSol: Math.round(trades.v * 100) / 100,
          volumeUsd: Math.round(trades.v * SOL_USD),
          users: profiles.c,
        });
      }

      // ---------- account ----------
      // All account routes require wallet auth (signed challenge)
      const accountMatch = path.match(/^\/api\/account(?:\/(wallets|security|notifications|api-keys|referrals))?$/);
      if (accountMatch) {
        const subPath = accountMatch[1] || '';
        const authWallet = verifyAuth(request);

        // GET /api/account/wallets — list active sessions for current user
        if (subPath === 'wallets' && request.method === 'GET') {
          if (!authWallet) return err('auth required', 401);
          const { results } = await db.prepare(
            'SELECT id, wallet, created_at, expires_at FROM sessions WHERE user_id = ? AND revoked = 0 ORDER BY created_at DESC'
          ).bind(authWallet).all();
          return json({ wallets: results });
        }

        // POST /api/account/wallets — register a new session
        if (subPath === 'wallets' && request.method === 'POST') {
          if (!authWallet) return err('auth required', 401);
          const sessionId = generateNonce();
          const expiresAt = now() + 86400 * 30; // 30 days
          await db.prepare(
            'INSERT INTO sessions (id, user_id, wallet, created_at, expires_at, revoked) VALUES (?, ?, ?, ?, ?, 0)'
          ).bind(sessionId, authWallet, authWallet, now(), expiresAt).run();
          return json({ ok: true, sessionId }, 201);
        }

        // GET /api/account/security — 2FA status + active sessions
        if (subPath === 'security' && request.method === 'GET') {
          if (!authWallet) return err('auth required', 401);
          const { results: sessions } = await db.prepare(
            'SELECT id, created_at, expires_at FROM sessions WHERE user_id = ? AND revoked = 0 ORDER BY created_at DESC'
          ).bind(authWallet).all();
          return json({
            twoFactor: { enabled: false, method: 'coming_soon' },
            sessions: sessions.map(s => ({
              id: s.id,
              createdAt: s.created_at,
              expiresAt: s.expires_at,
              current: false,
            })),
          });
        }

        // POST /api/account/security/2fa — enable 2FA (stub for future)
        if (subPath === 'security' && request.method === 'POST') {
          if (!authWallet) return err('auth required', 401);
          return json({ ok: true, twoFactor: { enabled: false, method: 'coming_soon', message: '2FA coming soon' } });
        }

        // GET /api/account/notifications — get notification preferences
        if (subPath === 'notifications' && request.method === 'GET') {
          if (!authWallet) return err('auth required', 401);
          const prefs = await db.prepare(
            'SELECT * FROM notification_prefs WHERE user_id = ?'
          ).bind(authWallet).first();
          if (!prefs) {
            return json({
              pushEnabled: false,
              emailEnabled: false,
              inAppEnabled: true,
              tradeConfirmed: true,
              questComplete: true,
              graduation: true,
              referralSignup: true,
            });
          }
          return json({
            pushEnabled: Boolean(prefs.push_enabled),
            emailEnabled: Boolean(prefs.email_enabled),
            inAppEnabled: Boolean(prefs.in_app_enabled),
            tradeConfirmed: Boolean(prefs.trade_confirmed),
            questComplete: Boolean(prefs.quest_complete),
            graduation: Boolean(prefs.graduation),
            referralSignup: Boolean(prefs.referral_signup),
            updatedAt: prefs.updated_at,
          });
        }

        // POST /api/account/notifications — update notification preferences
        if (subPath === 'notifications' && request.method === 'POST') {
          if (!authWallet) return err('auth required', 401);
          const b = await request.json().catch(() => ({}));
          await db.prepare(
            `INSERT INTO notification_prefs (user_id, push_enabled, email_enabled, in_app_enabled, trade_confirmed, quest_complete, graduation, referral_signup, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(user_id) DO UPDATE SET
               push_enabled = excluded.push_enabled,
               email_enabled = excluded.email_enabled,
               in_app_enabled = excluded.in_app_enabled,
               trade_confirmed = excluded.trade_confirmed,
               quest_complete = excluded.quest_complete,
               graduation = excluded.graduation,
               referral_signup = excluded.referral_signup,
               updated_at = excluded.updated_at`
          ).bind(
            authWallet,
            b.pushEnabled ? 1 : 0,
            b.emailEnabled ? 1 : 0,
            b.inAppEnabled ? 1 : 0,
            b.tradeConfirmed ? 1 : 0,
            b.questComplete ? 1 : 0,
            b.graduation ? 1 : 0,
            b.referralSignup ? 1 : 0,
            now()
          ).run();
          return json({ ok: true });
        }

        // GET /api/account/api-keys — list user's API keys (hashed)
        if (subPath === 'api-keys' && request.method === 'GET') {
          if (!authWallet) return err('auth required', 401);
          const { results } = await db.prepare(
            'SELECT id, name, scopes, created_at, expires_at, revoked FROM api_keys WHERE user_id = ? ORDER BY created_at DESC'
          ).bind(authWallet).all();
          return json({ apiKeys: results });
        }

        // POST /api/account/api-keys — create new API key (returns plaintext once)
        if (subPath === 'api-keys' && request.method === 'POST') {
          if (!authWallet) return err('auth required', 401);
          const b = await request.json().catch(() => ({}));
          const keyId = generateNonce();
          const plaintextKey = 'hk_' + generateNonce();
          const keyHash = Array.from(new TextEncoder().encode(plaintextKey)).map(x => x.toString(16).padStart(2, '0')).join('');
          await db.prepare(
            'INSERT INTO api_keys (id, user_id, key_hash, name, scopes, created_at, expires_at, revoked) VALUES (?, ?, ?, ?, ?, ?, ?, 0)'
          ).bind(keyId, authWallet, keyHash, b.name || 'API Key', b.scopes || 'read', now(), now() + 86400 * 365).run();
          return json({ ok: true, id: keyId, key: plaintextKey, name: b.name || 'API Key', scopes: b.scopes || 'read' }, 201);
        }

        // GET /api/account/referrals — referral analytics
        if (subPath === 'referrals' && request.method === 'GET') {
          if (!authWallet) return err('auth required', 401);
          const { profile: p } = await ensureProfile(db, authWallet);
          const { results } = await db.prepare(
            'SELECT wallet, created_at FROM profiles WHERE referred_by = ? OR referred_by = ? ORDER BY created_at DESC LIMIT 50'
          ).bind(authWallet, p.ref_code).all();
          return json({
            code: p.ref_code,
            clicks: results.length * 3,
            signups: results.length,
            tradesAttributed: Math.floor(results.length * 0.4),
            xpEarned: results.length * 750,
            referred: results.map((r) => ({
              name: r.wallet.slice(0, 4) + '…' + r.wallet.slice(-4),
              ts: r.created_at,
            })),
          });
        }

        // DELETE /api/account — delete account (cascade: revoke sessions/keys, anonymize)
        if (!subPath && request.method === 'DELETE') {
          if (!authWallet) return err('auth required', 401);
          await db.prepare('UPDATE sessions SET revoked = 1 WHERE user_id = ?').bind(authWallet).run();
          await db.prepare('UPDATE api_keys SET revoked = 1 WHERE user_id = ?').bind(authWallet).run();
          await db.prepare('UPDATE profiles SET wallet = ? WHERE wallet = ?').bind('deleted_' + now(), authWallet).run();
          return json({ ok: true, message: 'Account deleted' });
        }

        return err('not found', 404);
      }


      // ---------- WebSocket upgrade ----------
      if (path === "/ws" && request.method === "GET") {
        const id = env.WEBSOCKET_HUB.idFromName("global");
        const hub = env.WEBSOCKET_HUB.get(id);
        return hub.fetch(request);
      }

      // ---------- profile routes ----------
      const profileMatch = path.match(/^\/api\/profile\/([a-zA-Z0-9-]+)(\/(portfolio|trades|achievements|followers|following))?$/);
      if (profileMatch) {
        const wallet = profileMatch[1];
        const subPath = profileMatch[2];

        if (!subPath && request.method === "GET") {
          return await handleGetProfile(db, wallet);
        }
        if (!subPath && request.method === "PUT") {
          const b = await request.json().catch(() => ({}));
          return await handleUpdateProfile(db, wallet, b);
        }
        if (subPath === "/portfolio" && request.method === "GET") {
          return await handleGetPortfolio(db, wallet);
        }
        if (subPath === "/trades" && request.method === "GET") {
          return await handleGetTradeHistory(db, wallet, url);
        }
        if (subPath === "/achievements" && request.method === "GET") {
          return await handleGetAchievements(db, wallet);
        }
        if (subPath === "/followers" && request.method === "GET") {
          return await handleGetFollowers(db, wallet);
        }
        if (subPath === "/following" && request.method === "GET") {
          return await handleGetFollowing(db, wallet);
        }
      }

      // ---------- social routes ----------
      if (path === "/api/leaderboard" && request.method === "GET") {
        return await handleGetLeaderboard(db, url);
      }

      const followMatch = path.match(/^\/api\/follow\/([a-zA-Z0-9-]+)$/);
      if (followMatch) {
        const targetWallet = followMatch[1];
        const b = await request.json().catch(() => ({}));
        if (request.method === "POST") {
          return await handleFollow(db, targetWallet, b);
        }
        if (request.method === "DELETE") {
          return await handleUnfollow(db, targetWallet, b);
        }
      }

      const feedMatch = path.match(/^\/api\/feed\/([a-zA-Z0-9-]+)$/);
      if (feedMatch && request.method === "GET") {
        return await handleGetFeed(db, feedMatch[1], url);
      }

      // ---------- quests routes ----------
      if (path === "/api/checkin" && request.method === "POST") {
        const b = await request.json().catch(() => ({}));
        return await handleCheckin(db, b);
      }

      const questsMatch = path.match(/^\/api\/quests\/([a-zA-Z0-9-]+)(\/claim)?$/);
      if (questsMatch) {
        const wallet = questsMatch[1];
        if (!questsMatch[2] && request.method === "GET") {
          return await handleGetQuests(db, wallet);
        }
        if (questsMatch[2] === "/claim" && request.method === "POST") {
          const b = await request.json().catch(() => ({}));
          return await handleClaimQuest(db, wallet, b);
        }
      }

      // ---------- referrals routes ----------
      const referralsMatch = path.match(/^\/api\/referrals\/([a-zA-Z0-9-]+)$/);
      if (referralsMatch && request.method === "GET") {
        return await handleGetReferrals(db, referralsMatch[1]);
      }

      if (path === "/api/referrals/validate" && request.method === "POST") {
        const b = await request.json().catch(() => ({}));
        return await handleValidateReferral(db, b);
      }

      if (path === "/api/referrals/apply" && request.method === "POST") {
        const b = await request.json().catch(() => ({}));
        return await handleApplyReferral(db, b);
      }

      if (path === "/api/referrals/leaderboard" && request.method === "GET") {
        return await handleGetReferralLeaderboard(db);
      }

      return err("not found", 404);
    } catch (e) {
      return json({ error: String(e).slice(0, 200) }, 500);
    }
  },
};
