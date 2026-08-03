// Hermes Launchpad API — Cloudflare Worker (free tier) backed by D1.
// Endpoints: /api/health /api/tokens /api/tokens/:id /api/quests /api/leaderboard /api/stats

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...cors } });

const mapToken = (r) => ({
  id: r.id, name: r.name, ticker: r.ticker, emoji: r.emoji, lore: r.lore, creator: r.creator,
  marketCap: r.market_cap, price: r.price, change24h: r.change_24h, volume24h: r.volume_24h,
  holders: r.holders, curveProgress: r.curve_progress, replies: r.replies, riskScore: r.risk_score,
  sentiment: r.sentiment, chain: r.chain, spark: JSON.parse(r.spark || "[]"), createdMinsAgo: r.created_mins_ago,
});

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(request.url);
    const p = url.pathname;

    try {
      if (p === "/api/health") return json({ ok: true, service: "hermes-api", time: Date.now() });

      if (p === "/api/tokens") {
        const { results } = await env.DB.prepare("SELECT * FROM tokens ORDER BY volume_24h DESC").all();
        return json(results.map(mapToken));
      }
      const m = p.match(/^\/api\/tokens\/([a-z0-9-]+)$/i);
      if (m) {
        const r = await env.DB.prepare("SELECT * FROM tokens WHERE id = ?").bind(m[1]).first();
        return r ? json(mapToken(r)) : json({ error: "not found" }, 404);
      }
      if (p === "/api/quests") {
        const { results } = await env.DB.prepare("SELECT * FROM quests").all();
        return json(results);
      }
      if (p === "/api/leaderboard") {
        const { results } = await env.DB.prepare("SELECT * FROM leaderboard ORDER BY rank").all();
        return json(results.map(r => ({ rank: r.rank, name: r.name, pnl: r.pnl, trades: r.trades, winRate: r.win_rate, xp: r.xp })));
      }
      if (p === "/api/stats") {
        const t = await env.DB.prepare("SELECT COUNT(*) c, SUM(volume_24h) v FROM tokens").first();
        return json({ tokens: t.c, volume24h: t.v, programId: "E99nGQh6iCAC43azp4zvpefCRmfY9bZHV7J6LL2yu93U", cluster: "devnet" });
      }
      return json({ error: "not found" }, 404);
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  },
};
