import { Buffer } from 'buffer';
import {
  ComputeBudgetProgram, Connection, Keypair, PublicKey, Transaction, TransactionInstruction,
  SystemProgram, LAMPORTS_PER_SOL,
} from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey(import.meta.env.VITE_PROGRAM_ID ?? '9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz');
export const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://hermes-api.tahamtandariush.workers.dev';
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const RENT_SYSVAR = new PublicKey('SysvarRent111111111111111111111111111111111');

/** Resolve RPC URL for web3.js Connection. VITE_RPC_PROXY may be a relative Pages path (e.g. "/rpc"). */
function rpcEndpoint(): string {
  const proxy = import.meta.env.VITE_RPC_PROXY as string | undefined;
  if (proxy && proxy.length > 0) {
    if (proxy.startsWith('/')) {
      if (typeof window !== 'undefined' && window.location?.origin) {
        return `${window.location.origin}${proxy}`;
      }
      return (
        (import.meta.env.VITE_SOLANA_RPC as string | undefined) ||
        'https://api.devnet.solana.com'
      );
    }
    return proxy;
  }
  return (
    (import.meta.env.VITE_SOLANA_RPC as string | undefined) ||
    'https://api.devnet.solana.com'
  );
}

export const connection = new Connection(rpcEndpoint(), 'confirmed');

// Anchor instruction discriminators (sha256("global:<name>")[0..8]).
const DISC = {
  initialize: Uint8Array.from([0xaf, 0xaf, 0x6d, 0x1f, 0x0d, 0x98, 0x9b, 0xed]),
  createToken: Uint8Array.from([0x54, 0x34, 0xcc, 0xe4, 0x18, 0x8c, 0xea, 0x4b]),
  buy: Uint8Array.from([0x66, 0x06, 0x3d, 0x12, 0x01, 0xda, 0xeb, 0xea]),
  sell: Uint8Array.from([0x33, 0xe6, 0x85, 0xa4, 0x01, 0x7f, 0x83, 0xad]),
};

export const findConfigPda = () =>
  PublicKey.findProgramAddressSync([new TextEncoder().encode('config')], PROGRAM_ID)[0];

export const findCurvePda = (mint: PublicKey) =>
  PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), mint.toBuffer()], PROGRAM_ID)[0];

export const findAta = (mint: PublicKey, owner: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ATA_PROGRAM_ID
  )[0];

const u64 = (n: bigint): Uint8Array => {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, n, true);
  return b;
};
const anchorString = (s: string): Uint8Array => {
  const e = new TextEncoder().encode(s);
  const b = new Uint8Array(4 + e.length);
  new DataView(b.buffer).setUint32(0, e.length, true);
  b.set(e, 4);
  return b;
};
const concat = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};

export function buildCreateTokenIx(
  payer: PublicKey, mint: PublicKey,
  name: string, symbol: string, uri: string
): TransactionInstruction {
  const curve = findCurvePda(mint);
  const curveAta = findAta(mint, curve);
  const data = concat(DISC.createToken, anchorString(name), anchorString(symbol), anchorString(uri));
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: findConfigPda(), isSigner: false, isWritable: false },
      { pubkey: curve, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: true, isWritable: true },
      { pubkey: curveAta, isSigner: false, isWritable: true },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ATA_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: RENT_SYSVAR, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });
}

export function buildTradeIx(
  kind: 'buy' | 'sell',
  trader: PublicKey, mint: PublicKey,
  amount: bigint, minOut: bigint,
  feeWallet: PublicKey, creatorWallet: PublicKey
): TransactionInstruction {
  const curve = findCurvePda(mint);
  const curveAta = findAta(mint, curve);
  const traderAta = findAta(mint, trader);
  const data = concat(kind === 'buy' ? DISC.buy : DISC.sell, u64(amount), u64(minOut));
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: findConfigPda(), isSigner: false, isWritable: false },
      { pubkey: curve, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: curveAta, isSigner: false, isWritable: true },
      { pubkey: traderAta, isSigner: false, isWritable: true },
      { pubkey: trader, isSigner: true, isWritable: true },
      { pubkey: feeWallet, isSigner: false, isWritable: true },
      { pubkey: creatorWallet, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ATA_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });
}

export const solToLamports = (sol: number) => BigInt(Math.round(sol * LAMPORTS_PER_SOL));

/** Phantom / Solflare injected provider. */
export interface WalletProvider {
  publicKey: PublicKey;
  connect(): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  signAndSendTransaction(tx: Transaction): Promise<{ signature: string } | string>;
  signTransaction(tx: Transaction): Promise<Transaction>;
}

export function getProvider(): WalletProvider | null {
  const w = window as unknown as { solana?: WalletProvider & { isPhantom?: boolean } };
  return w.solana ?? null;
}

/** Get an auth challenge nonce from the worker and sign it with the wallet. */
export async function signAuthChallenge(wallet: string): Promise<{ signature: string; nonce: string } | null> {
  try {
    const provider = getProvider();
    if (!provider || !provider.signMessage) return null;
    const res = await fetch(`${API_BASE}/api/auth/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet }),
    });
    if (!res.ok) return null;
    const { nonce, message } = await res.json();
    const encoded = new TextEncoder().encode(message);
    const { signature } = await provider.signMessage(encoded);
    return { signature: btoa(String.fromCharCode(...signature)), nonce };
  } catch {
    return null;
  }
}

export async function sendTx(
  provider: WalletProvider,
  tx: Transaction,
  opts?: { extraSigner?: Keypair }
): Promise<{ signature: string; slot: number }> {
  tx.instructions = tx.instructions.filter((ix) => !(
    ix.programId.equals(ComputeBudgetProgram.programId) && ix.data.length > 0 && ix.data[0] === 1
  ));
  tx.instructions.unshift(ComputeBudgetProgram.requestHeapFrame({ bytes: 256 * 1024 }));
  tx.feePayer = provider.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  if (opts?.extraSigner) tx.partialSign(opts.extraSigner);

  const needsRaw =
    opts?.extraSigner !== undefined ||
    // heuristic: already has signatures beyond empty
    tx.signatures.some((s) => s.signature != null);

  let sig: string;
  if (needsRaw && provider.signTransaction) {
    const signed = await provider.signTransaction(tx);
    sig = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
  } else {
    const res = await provider.signAndSendTransaction(tx);
    sig = typeof res === 'string' ? res : (res as any)?.signature ?? String(res); // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  const confirmResult = await connection.confirmTransaction(sig, 'confirmed');
  const slot = (confirmResult as any)?.context?.slot ?? (confirmResult as any)?.slot ?? 0; // eslint-disable-line @typescript-eslint/no-explicit-any
  return { signature: sig, slot };
}

// ---- Curve math (mirrors on-chain program) ----
export const V_SOL0 = 30_000_000_000n; // 30 SOL lamports
export const V_TOK0 = 1_073_000_000_000_000n; // 1.073B tokens
export const FEE_BPS = 25n; // 0.25% each (platform + creator = 0.5% total on-chain)
export const BPS_DENOM = 10_000n;
export const MAX_TRADE_BPS = 5_000n; // 50% of virtual base
export const MIGRATION_THRESHOLD = 85_000_000_000n; // 85 SOL lamports

export interface CurveState {
  virtualSol: number;
  virtualTokens: number;
  realSol: number;
  complete: boolean;
}

export async function fetchCurveState(mint: PublicKey): Promise<CurveState | null> {
  try {
    const curvePda = findCurvePda(mint);
    const data = await connection.getAccountInfo(curvePda);
    if (!data) return null;
    // Parse Anchor account (discriminator 8 bytes + Curve struct)
    // Layout: creator(32), mint(32), virtual_token_reserves(u64), virtual_sol_reserves(u64),
    // real_token_reserves(u64), real_sol_reserves(u64), complete(bool), bump(u8), name, symbol, uri
    const view = new DataView(data.data.buffer, data.data.byteOffset, data.data.byteLength);
    let offset = 8; // skip discriminator
    offset += 32; // creator
    offset += 32; // mint
    const virtualTokenReserves = Number(view.getBigUint64(offset, true)); offset += 8;
    const virtualSolReserves = Number(view.getBigUint64(offset, true)); offset += 8;
    offset += 8; // real_token_reserves
    const realSolReserves = Number(view.getBigUint64(offset, true)); offset += 8;
    const complete = Boolean(view.getUint8(offset));
    return {
      virtualSol: virtualSolReserves,
      virtualTokens: virtualTokenReserves,
      realSol: realSolReserves,
      complete,
    };
  } catch {
    return null;
  }
}

export function computeBuyQuote(solIn: number, vs: number, vt: number): { tokOut: number; minOut: bigint } {
  const solInLamports = BigInt(Math.round(solIn * 1_000_000_000));
  const fee = (solInLamports * FEE_BPS * 2n) / BPS_DENOM; // platform + creator = 0.5%
  const solAfterFees = solInLamports - fee;
  const k = BigInt(vs) * BigInt(vt);
  const newVs = BigInt(vs) + solAfterFees;
  const newVt = k / newVs;
  const tokOut = BigInt(vt) - newVt;
  return { tokOut: Number(tokOut), minOut: (tokOut * 99n) / 100n }; // 1% slippage
}

export function computeSellQuote(tokIn: number, vs: number, vt: number): { solOut: number; minOut: bigint } {
  const tokInRaw = BigInt(Math.floor(tokIn * 1_000_000));
  const k = BigInt(vs) * BigInt(vt);
  const newVt = BigInt(vt) + tokInRaw;
  const newVs = k / newVt;
  const solGross = BigInt(vs) - newVs;
  const fee = (solGross * FEE_BPS * 2n) / BPS_DENOM;
  const solOut = solGross - fee;
  return { solOut: Number(solOut) / 1_000_000_000, minOut: (solOut * 99n) / 100n };
}

export async function ensureAtaIx(mint: PublicKey, owner: PublicKey): Promise<TransactionInstruction | null> {
  const ata = findAta(mint, owner);
  const info = await connection.getAccountInfo(ata);
  if (info) return null;
  const { createAssociatedTokenAccountInstruction } = await import('@solana/spl-token');
  return createAssociatedTokenAccountInstruction(owner, ata, owner, mint);
}
