const DEVNET_RPC = "https://api.devnet.solana.com";
const PUBKEY_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const SIGNATURE_RE = /^[1-9A-HJ-NP-Za-km-z]{80,100}$/;

const accountKey = (key) => typeof key === "string" ? key : key.pubkey;
const instructionAccounts = (instruction, keys) =>
  (instruction.accounts || []).map((account) =>
    typeof account === "number" ? keys[account] : accountKey(account));

async function confirmedTransaction(signature, rpcUrl) {
  if (!SIGNATURE_RE.test(signature)) return null;
  try {
    const response = await fetch(rpcUrl || DEVNET_RPC, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getTransaction",
        params: [signature, { encoding: "json", commitment: "confirmed", maxSupportedTransactionVersion: 0 }] }),
    });
    const body = await response.json();
    return body?.result?.meta?.err ? null : body?.result || null;
  } catch { return null; }
}

function matchingInstruction(result, programId, mint, wallet, walletIndex) {
  if (![programId, mint, wallet].every((value) => PUBKEY_RE.test(value))) return null;
  const message = result.transaction.message;
  const keys = message.accountKeys.map(accountKey);
  return message.instructions.find((instruction) => {
    const instructionProgram = instruction.programId || keys[instruction.programIdIndex];
    const accounts = instructionAccounts(instruction, keys);
    return instructionProgram === programId && accounts[2] === mint && accounts[walletIndex] === wallet;
  }) || null;
}

export async function verifyCreateTransaction({ signature, programId, mint, creator, rpcUrl }) {
  const result = await confirmedTransaction(signature, rpcUrl);
  return result && matchingInstruction(result, programId, mint, creator, 4) ? { creator } : null;
}

export async function verifyTradeTransaction({ signature, programId, mint, wallet, side, rpcUrl }) {
  const result = await confirmedTransaction(signature, rpcUrl);
  if (!result) return null;
  const instruction = matchingInstruction(result, programId, mint, wallet, 5);
  const expected = side === "buy" ? "Instruction: Buy" : "Instruction: Sell";
  return instruction && result.meta?.logMessages?.some((line) => line.includes(expected)) ? { wallet } : null;
}
