import { Buffer } from 'buffer';
import {
  Connection, PublicKey, Transaction, TransactionInstruction,
  SystemProgram, LAMPORTS_PER_SOL,
} from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey('E99nGQh6iCAC43azp4zvpefCRmfY9bZHV7J6LL2yu93U');
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const RENT_SYSVAR = new PublicKey('SysvarRent111111111111111111111111111111111');

// Keyless public devnet RPCs (api.devnet.solana.com blocks some providers).
const RPC_CANDIDATES = [
  'https://devnet.rpcpool.com',
  'https://api.devnet.solana.com',
];
export const connection = new Connection(RPC_CANDIDATES[0], 'confirmed');

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
  signAndSendTransaction(tx: Transaction): Promise<{ signature: string } | string>;
  signTransaction(tx: Transaction): Promise<Transaction>;
}

export function getProvider(): WalletProvider | null {
  const w = window as unknown as { solana?: WalletProvider & { isPhantom?: boolean } };
  return w.solana ?? null;
}

export async function sendTx(provider: WalletProvider, tx: Transaction): Promise<string> {
  tx.feePayer = provider.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const res = await provider.signAndSendTransaction(tx);
  const sig = typeof res === 'string' ? res : res.signature;
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}
