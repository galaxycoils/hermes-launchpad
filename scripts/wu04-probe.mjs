import { Connection, PublicKey } from "@solana/web3.js";

const RAYDIUM = new PublicKey("DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb");
const RPC = process.env.SOLANA_RPC || "https://api.devnet.solana.com";

async function main() {
  const conn = new Connection(RPC, "confirmed");
  const results = [];
  for (let i = 0; i < 50; i++) {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("amm_config"), Buffer.from([0, i])],
      RAYDIUM,
    );
    try {
      const info = await conn.getAccountInfo(pda);
      if (!info || !info.data) { results.push({ i, status: "empty" }); continue; }
      const owner = info.owner.toBase58();
      const isRaydium = owner === RAYDIUM.toBase58();
      results.push({ i, status: isRaydium ? "raydium-owned" : "foreign-owner", owner, len: info.data.length });
    } catch (e) {
      results.push({ i, status: "error", msg: String(e).slice(0, 80) });
    }
  }
  const valid = results.filter((r) => r.status === "raydium-owned");
  console.log("amm_config probe: " + valid.length + "/50 raydiium-owned");
  console.log(JSON.stringify(results.slice(0, 6)));
  console.log(JSON.stringify(results.filter(r => r.status !== "empty").slice(0, 6)));
  process.exit(valid.length === 0 ? 2 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
