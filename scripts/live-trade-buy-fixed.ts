#!/usr/bin/env npx tsx
// Build the correct ATA and execute a SMOKE buy on devnet.
// Uses canonical [owner, mint, TOKEN_PROGRAM_ID] ATA address.

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction, ComputeBudgetProgram, sendAndConfirmTransaction, SystemProgram } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token';
import fs from 'fs';

const CONFIG = {
  RPC: 'https://devnet.rpcpool.com',
  PROGRAM_ID: '9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz',
  TOKEN_PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA',
  ATA_PROGRAM_ID: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  MINT: 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f',
  TRADER: 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a',
  FEE_WALLET: 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a',
  CREATOR_WALLET: 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a',
  KEYPAIR: '/Users/cmd/.config/solana/id.json',
  SMOKE_AMOUNT_SOL: 0.02,
};

const PROGRAM_ID = new PublicKey(CONFIG.PROGRAM_ID);
const TOKEN_PROGRAM_ID = new PublicKey(CONFIG.TOKEN_PROGRAM_ID);
const ATA_PROGRAM_ID = new PublicKey(CONFIG.ATA_PROGRAM_ID);
const MINT = new PublicKey(CONFIG.MINT);
const TRADER = new PublicKey(CONFIG.TRADER);
const FEE_WALLET = new PublicKey(CONFIG.FEE_WALLET);
const CREATOR_WALLET = new PublicKey(CONFIG.CREATOR_WALLET);

const connection = new Connection(CONFIG.RPC, 'confirmed');
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(CONFIG.KEYPAIR, 'utf8'))));
const TRADER_B58 = TRADER.toBase58();

// Use spl-token's canonical ATA derivation (same as on-chain)
const canonicalAta = getAssociatedTokenAddressSync(MINT, TRADER);
const CANONICAL_ATA_B58 = canonicalAta.toBase58();

console.log('Canonical ATA address:', CANONICAL_ATA_B58);
console.log('Trader wallet:', TRADER_B58);
console.log('');

// Check if canonical ATA exists on-chain
const ataInfo = await connection.getAccountInfo(canonicalAta);
if (!ataInfo) {
  console.log('Canonical ATA ' + CANONICAL_ATA_B58 + ' does not exist — creating it now...');
  const lamports = await connection.getMinimumBalanceForRentExemption(165);
  const createAtaIx = createAssociatedTokenAccountInstruction(
    kp.publicKey,
    canonicalAta,
    TRADER,
    MINT,
    TOKEN_PROGRAM_ID,
    ATA_PROGRAM_ID,
  );
  const tx = new Transaction().add(createAtaIx);
  tx.feePayer = kp.publicKey;
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.sign(kp);
  await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
  console.log('ATA created!');
} else {
  console.log('Canonical ATA already exists — skipping creation.');
}

// Make sure trader has enough SOL
const traderInfo = await connection.getAccountInfo(TRADER);
const traderLamports = traderInfo ? traderInfo.lamports : 0;
const neededLamports = BigInt(Math.round(CONFIG.SMOKE_AMOUNT_SOL * Number(LAMPORTS_PER_SOL))) + 1000000n;
console.log(`Trader lamports: ${traderLamports} (${Number(traderLamports) / Number(LAMPORTS_PER_SOL)} SOL)`);
console.log(`Needed for trade (amount + fee buffer): ${neededLamports} (${Number(neededLamports) / Number(LAMPORTS_PER_SOL)} SOL)`);

if (traderLamports < neededLamports) {
  console.log(`Not enough SOL — need at least ${Number(neededLamports) / Number(LAMPORTS_PER_SOL)} SOL`);
  console.log('Fund the wallet first or reduce amount.');
  process.exit(1);
}

const lamports = BigInt(Math.round(CONFIG.SMOKE_AMOUNT_SOL * Number(LAMPORTS_PER_SOL)));
// Hermes buy/sell takes amount in lamports on the SOL side.
// SMOKE decimals unknown; pass lamports directly as the SOL input amount.
const minOut = lamports / 100n; // conservative 1% slippage floor

console.log(`\nBuying ${CONFIG.SMOKE_AMOUNT_SOL} SOL worth of SMOKE`);
console.log(`  lamports: ${lamports}`);
console.log(`  minOut: ${minOut}`);

const DISC_BUY = Uint8Array.from([0x66, 0x06, 0x3d, 0x12, 0x01, 0xda, 0xeb, 0xea]);

function u64(n: bigint): Uint8Array {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, n, true);
  return b;
}

const configPda = PublicKey.findProgramAddressSync([new TextEncoder().encode('config')], PROGRAM_ID)[0];
const curvePda = PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), MINT.toBuffer()], PROGRAM_ID)[0];

const buyIx = new TransactionInstruction({
  programId: PROGRAM_ID,
  keys: [
    { pubkey: configPda, isSigner: false, isWritable: false },
    { pubkey: curvePda, isSigner: false, isWritable: true },
    { pubkey: MINT, isSigner: false, isWritable: false },
    { pubkey: canonicalAta, isSigner: false, isWritable: true },
    { pubkey: TRADER, isSigner: true, isWritable: true },
    { pubkey: FEE_WALLET, isSigner: false, isWritable: true },
    { pubkey: CREATOR_WALLET, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ATA_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ],
  data: Buffer.from(Uint8Array.from([...DISC_BUY, ...(u64(lamports) as Uint8Array), ...(u64(minOut) as Uint8Array)])),
});

const tx = new Transaction();
tx.add(ComputeBudgetProgram.requestHeapFrame({ bytes: 256 * 1024 }));
tx.add(buyIx);
tx.feePayer = TRADER;

const { blockhash: bh } = await connection.getLatestBlockhash('confirmed');
tx.recentBlockhash = bh;
tx.sign(kp);

console.log('\nSending buy transaction...');
try {
  const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
  console.log('BUY SIG:', sig);
  console.log('BUY CONFIRMED!');
  console.log('Explorer: https://explorer.solana.com/tx/' + sig + '?cluster=devnet');
  fs.writeFileSync('/tmp/smoke-buy-sig.txt', sig);
} catch (e: any) {
  console.log('BUY FAILED:', e.message);
  console.log('Logs:', (e.transactionLogs || []).join('\n'));
}
