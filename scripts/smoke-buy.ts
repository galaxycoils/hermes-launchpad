#!/usr/bin/env npx tsx
// Execute SMOKE buy on devnet using fixed (canonical) findAta.
// Creates canonical ATA if missing.

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction, ComputeBudgetProgram, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import fs from 'fs';

const CONFIG = {
  RPC: 'https://devnet.rpcpool.com',
  PROGRAM_ID: '9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz',
  TOKEN_PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA',
  ATA_PROGRAM_ID: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  MINT: 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f',
  TRADER: '8e24Szb7NqbqcymkzoYpATYxZsiK14z8jPXhYFwaUfDp',
  FEE_WALLET: '9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr',
  CREATOR_WALLET: '9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr',
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

// Canonical findAta (owner, mint, TOKEN_PROGRAM_ID) — matches fixed solana.ts
const [traderAta] = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
);
const TRADER_ATA_B58 = traderAta.toBase58();

console.log('=== Task 5: SMOKE Buy ===\n');
console.log('Program ID     :', CONFIG.PROGRAM_ID);
console.log('SMOKE mint     :', CONFIG.MINT);
console.log('Trader wallet  :', TRADER_B58);
console.log('Trader ATA     :', TRADER_ATA_B58);
console.log('Fee wallet     :', CONFIG.FEE_WALLET);
console.log('');

// Check trader SOL balance
const traderInfo = await connection.getAccountInfo(TRADER);
const traderLamports = traderInfo?.lamports ?? 0;
console.log('Trader SOL:', (traderLamports / LAMPORTS_PER_SOL).toFixed(4), 'SOL');

const SMOKE_AMOUNT_SOL = CONFIG.SMOKE_AMOUNT_SOL;
const lamports = BigInt(Math.round(SMOKE_AMOUNT_SOL * LAMPORTS_PER_SOL));
const minOut = lamports; // conservative 1:1

console.log(`Buy amount: ${SMOKE_AMOUNT_SOL} SOL = ${lamports} lamports`);
console.log(`Min out   : ${minOut}\n`);

// Create canonical ATA if missing
const ataInfo = await connection.getAccountInfo(traderAta);
if (!ataInfo) {
  console.log('Canonical ATA not on-chain — creating...');
  const rent = await connection.getMinimumBalanceForRentExemption(165);
  const createAtaIx = createAssociatedTokenAccountInstruction(
    kp.publicKey, traderAta, TRADER, MINT, TOKEN_PROGRAM_ID, ATA_PROGRAM_ID,
  );
  const tx = new Transaction().add(createAtaIx);
  tx.feePayer = kp.publicKey;
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.sign(kp);
  const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
  console.log('ATA created:', sig);
  console.log('Explorer: https://explorer.solana.com/tx/' + sig + '?cluster=devnet');
} else {
  console.log('Canonical ATA already exists — skipping creation.');
}
console.log('');

// Build buy instruction (matching fixed buildTradeIx with canonical ATA)
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
    { pubkey: traderAta, isSigner: false, isWritable: true },
    { pubkey: TRADER, isSigner: true, isWritable: true },
    { pubkey: FEE_WALLET, isSigner: false, isWritable: true },
    { pubkey: CREATOR_WALLET, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ATA_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ],
  data: Buffer.from(Uint8Array.from([...DISC_BUY, ...u64(lamports), ...u64(minOut)])),
});

const tx = new Transaction();
tx.add(ComputeBudgetProgram.requestHeapFrame({ bytes: 256 * 1024 }));
tx.add(buyIx);
tx.feePayer = TRADER;

const { blockhash: bh } = await connection.getLatestBlockhash('confirmed');
tx.recentBlockhash = bh;
tx.sign(kp);

console.log('Sending buy...');
try {
  const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
  console.log('\n=== BUY CONFIRMED ===');
  console.log('Signature:', sig);
  console.log('Explorer: https://explorer.solana.com/tx/' + sig + '?cluster=devnet');
  fs.writeFileSync('/tmp/smoke-buy-sig.txt', sig);
  console.log('Saved to /tmp/smoke-buy-sig.txt');
} catch (e: any) {
  console.error('\nBUY FAILED:', e.message);
  if (e.transactionLogs) console.error('Logs:', e.transactionLogs.join('\n'));
  process.exit(1);
}
