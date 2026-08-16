const DEVNET_RPC = "https://devnet.rpcpool.com";
const RPC_FALLBACKS = [
  "https://devnet.rpcpool.com",
  "https://api.devnet.solana.com",
  "https://devnet.helius-rpc.com",
];
const PUBKEY_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const SIGNATURE_RE = /^[1-9A-HJ-NP-Za-km-z]{80,100}$/;

// Anchor PDA seed for the Curve account: ["curve", mint, bump]
// Layout (after 8-byte discriminator):
//   creator: 32 | mint: 32 | virtual_token_reserves: u64 | virtual_sol_reserves: u64
//   real_token_reserves: u64 | real_sol_reserves: u64 | complete: bool | bump: u8
//   name: (4 + len) | symbol: (4 + len) | uri: (4 + len)
async function curvePda(mint, programId) {
  const { PublicKey, Buffer } = await import("@solana/web3.js").then((m) => ({
    PublicKey: m.PublicKey,
    Buffer: m.Buffer || globalThis.Buffer,
  }));
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("curve"), new PublicKey(mint).toBuffer()],
    new PublicKey(programId),
  );
  return pda;
}

function rpcList(preferred) {
  const out = [];
  const add = (u) => {
    if (u && typeof u === "string" && !out.includes(u)) out.push(u);
  };
  add(preferred);
  for (const u of RPC_FALLBACKS) add(u);
  return out;
}

// Decode the on-chain Curve account. Returns { realSol, complete, virtualSol, virtualTokens }
// or null on any failure. Mirrors src/lib/solana.ts fetchCurveState.
export async function fetchCurveState({ mint, programId, rpcUrl }) {
  if (!PUBKEY_RE.test(mint) || !PUBKEY_RE.test(programId)) return null;
  const { Connection } = await import("@solana/web3.js");
  for (const url of rpcList(rpcUrl || DEVNET_RPC)) {
    try {
      const conn = new Connection(url, "confirmed");
      const pda = await curvePda(mint, programId);
      const info = await conn.getAccountInfo(pda);
      if (!info || !info.data) continue;
      const buf = Buffer.from(info.data);
      if (buf.length < 8 + 32 * 2 + 8 * 4 + 1 + 1) continue;
      let off = 8; // discriminator
      off += 32; // creator
      off += 32; // mint
      const virtualTokens = buf.readBigUInt64LE(off); off += 8;
      const virtualSol = buf.readBigUInt64LE(off); off += 8;
      off += 8; // real_token_reserves
      const realSolLamports = buf.readBigUInt64LE(off); off += 8;
      const complete = buf.readUInt8(off) === 1;
      return {
        realSol: Number(realSolLamports) / 1e9,
        complete,
        virtualSol: Number(virtualSol) / 1e9,
        virtualTokens: Number(virtualTokens) / 1e6,
      };
    } catch {
      // try next RPC
    }
  }
  return null;
}

// Account indices per Anchor program (lib.rs):
// CreateToken: 0=config, 1=curve, 2=mint, 3=curve_token_account, 4=creator, 5=token_program, 6=ata_program, 7=system, 8=rent
// Trade:       0=config, 1=curve, 2=mint, 3=curve_token_account, 4=trader_ata, 5=trader, 6=fee_wallet, 7=creator_wallet, 8=token_program, 9=ata_program, 10=system

const accountKey = (key) => (typeof key === "string" ? key : key.pubkey);
const instructionAccounts = (instruction, keys) =>
  (instruction.accounts || []).map((account) =>
    typeof account === "number" ? keys[account] : accountKey(account),
  );

async function confirmedTransaction(signature, rpcUrl) {
  if (!SIGNATURE_RE.test(signature)) return null;
  for (const url of rpcList(rpcUrl || DEVNET_RPC)) {
    console.error("[DBG] confirmedTransaction rpcUrl", url.slice(0, 60) + "...");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTransaction",
          params: [
            signature,
            {
              encoding: "json",
              commitment: "confirmed",
              maxSupportedTransactionVersion: 0,
            },
          ],
        }),
      });
      if (!response.ok) continue;
      const body = await response.json();
      console.error("[DBG] confirmedTransaction response", body?.result ? "ok" : "empty", "err", body?.result?.meta?.err);
      if (body?.result?.meta?.err) return null;
      if (body?.result) return body.result;
    } catch (e) {
      console.error("[DBG] confirmedTransaction error", String(e));
      // try next RPC
    }
  }
  return null;
}

function matchingInstruction(result, programId, mint, wallet, walletIndex) {
  if (![programId, mint, wallet].every((value) => PUBKEY_RE.test(value))) return null;
  const message = result.transaction.message;
  const keys = message.accountKeys.map(accountKey);
  return (
    message.instructions.find((instruction) => {
      const instructionProgram =
        instruction.programId || keys[instruction.programIdIndex];
      const accounts = instructionAccounts(instruction, keys);
      return (
        instructionProgram === programId &&
        accounts[2] === mint &&
        accounts[walletIndex] === wallet
      );
    }) || null
  );
}

export async function verifyCreateTransaction({
  signature,
  programId,
  mint,
  creator,
  rpcUrl,
}) {
  const result = await confirmedTransaction(signature, rpcUrl);
  console.error("[DBG] verifyCreateTransaction sig", signature.slice(0, 24) + "...", "result", result ? "present" : "null");
  if (result) {
    const keys = result.transaction.message.accountKeys.map((k) => (typeof k === "string" ? k : k.pubkey));
    console.error("[DBG] accountKeys", keys.slice(0, 12));
    console.error("[DBG] instructions", JSON.stringify(result.transaction.message.instructions));
    const match = matchingInstruction(result, programId, mint, creator, 4);
    console.error("[DBG] matchingInstruction", match ? "match" : "no-match");
    return match ? { creator } : null;
  }
  return null;
}

export async function verifyTradeTransaction({
  signature,
  programId,
  mint,
  wallet,
  side,
  rpcUrl,
}) {
  const result = await confirmedTransaction(signature, rpcUrl);
  if (!result) return null;
  const instruction = matchingInstruction(result, programId, mint, wallet, 5);
  const expected = side === "buy" ? "Instruction: Buy" : "Instruction: Sell";
  return instruction &&
    result.meta?.logMessages?.some((line) => line.includes(expected))
    ? { wallet }
    : null;
}
