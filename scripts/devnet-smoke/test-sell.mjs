import { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL, ComputeBudgetProgram, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { Buffer } from 'buffer';

const RPC = 'https://devnet.rpcpool.com';
const PROGRAM_ID = new PublicKey('9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz');
const FEE_WALLET = new PublicKey('GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const RENT_SYSVAR = new PublicKey('SysvarRent111111111111111111111111111111111');
const WORKER_API = 'https://hermes-api.tahamtandariush.workers.dev';

const fs = await import('fs/promises');
const secretKey = Uint8Array.from(JSON.parse(await fs.readFile('/Users/cmd/.config/solana/id.json', 'utf-8')));
const payer = Keypair.fromSecretKey(secretKey);
console.log('Payer:', payer.publicKey.toBase58());

const conn = new Connection(RPC, 'confirmed');

const findConfigPda = () => PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID)[0];
const findCurvePda = (mint) => PublicKey.findProgramAddressSync([Buffer.from('curve'), mint.toBuffer()], PROGRAM_ID)[0];
const findAta = (mint, owner) => PublicKey.findProgramAddressSync([owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], ATA_PROGRAM_ID)[0];

const DISC = {
  createToken: Uint8Array.from([0x54, 0x34, 0xcc, 0xe4, 0x18, 0x8c, 0xea, 0x4b]),
  buy: Uint8Array.from([0x66, 0x06, 0x3d, 0x12, 0x01, 0xda, 0xeb, 0xea]),
  sell: Uint8Array.from([0x33, 0xe6, 0x85, 0xa4, 0x01, 0x7f, 0x83, 0xad]),
};

const u64 = (n) => { const b = new Uint8Array(8); new DataView(b.buffer).setBigUint64(0, n, true); return b; };
const anchorString = (s) => { const e = new TextEncoder().encode(s); const b = new Uint8Array(4 + e.length); new DataView(b.buffer).setUint32(0, e.length, true); b.set(e, 4); return b; };
const concat = (...parts) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };

function buildTradeIx(kind, trader, mint, amount, minOut, feeWallet, creatorWallet) {
  const curve = findCurvePda(mint);
  const curveAta = findAta(mint, curve);
  const traderAta = findAta(mint, trader);
  const data = concat(kind === 'buy' ? DISC.buy : DISC.sell, u64(amount), u64(minOut));
  return new TransactionInstruction({ programId: PROGRAM_ID, keys: [
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
  ], data: Buffer.from(data) });
}

const mint = new PublicKey('2LMEzefSpPZ9qFEg9weVcmqUAWKiK4JNjDN5KjHBhkcK');

// Get curve state for sell quote
const curve = findCurvePda(mint);
const curveInfo = await conn.getAccountInfo(curve);
const view = new DataView(curveInfo.data.buffer, curveInfo.data.byteOffset, curveInfo.data.byteLength);
let offset = 8;
offset += 32; offset += 32;
const vt = Number(view.getBigUint64(offset, true)); offset += 8;
const vs = Number(view.getBigUint64(offset, true)); offset += 8;

console.log('Curve state:', { vs, vt });

const tokIn = 355760339488; // tokens from buy
const tokInRaw = BigInt(tokIn);
const FEE_BPS = 25n; const BPS_DENOM = 10000n;
const k = BigInt(vs) * BigInt(vt);
const newVt = BigInt(vt) + tokInRaw;
const newVs = k / newVt;
const solGross = BigInt(vs) - newVs;
const fee = (solGross * FEE_BPS * 2n) / BPS_DENOM;
const solOut = solGross - fee;

console.log('Sell quote:', { tokIn: tokInRaw.toString(), solOut: solOut.toString() });

// Sell
const sellIx = buildTradeIx('sell', payer.publicKey, mint, tokInRaw, solOut, FEE_WALLET, payer.publicKey);

const sellTx = new Transaction().add(sellIx);
sellTx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
sellTx.feePayer = payer.publicKey;
sellTx.instructions.unshift(ComputeBudgetProgram.requestHeapFrame({ bytes: 256 * 1024 }));

const sellSig = await sendAndConfirmTransaction(conn, sellTx, [payer]);
console.log('Sell signature:', sellSig);

// Index sell trade
const sellIndexRes = await fetch(`${WORKER_API}/api/trades/index`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mint: mint.toBase58(),
    signature: sellSig,
    wallet: payer.publicKey.toBase58(),
    side: 'sell',
  }),
});
console.log('Sell index response:', await sellIndexRes.json());
