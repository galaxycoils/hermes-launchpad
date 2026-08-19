#!/usr/bin/env npx tsx
// Create missing ATAs on devnet for SMOKE trade:
// 1. curveAta  (ATA for curve PDA at SMOKE mint)
// 2. traderAta (ATA for trader wallet at SMOKE mint)
// Uses fee wallet GkHE2vb8j... (16 SOL, keypair owner).
// Both ATAs use canonical [owner, mint, TOKEN_PROGRAM_ID] derivation.

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction, ComputeBudgetProgram, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import fs from 'fs';

const RPC = 'https://devnet.rpcpool.com';
const PROGRAM_ID_B58 = '9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz';
const TOKEN_PROGRAM_ID_B58 = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA';
const ATA_PROGRAM_ID_B58 = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const MINT_B58 = 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f';
const TRADER_B58 = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const FEE_WALLET_B58 = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const CREATOR_WALLET_B58 = '9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr';
const KEYPAIR_PATH = '/Users/cmd/.config/solana/id.json';

const connection = new Connection(RPC, 'confirmed');
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8'))));

const PROGRAM_ID = new PublicKey(PROGRAM_ID_B58);
const TOKEN_PROGRAM_ID = new PublicKey(TOKEN_PROGRAM_ID_B58);
const ATA_PROGRAM_ID = new PublicKey(ATA_PROGRAM_ID_B58);
const MINT = new PublicKey(MINT_B58);
const TRADER = new PublicKey(TRADER_B58);
const FEE_WALLET = new PublicKey(FEE_WALLET_B58);
const CREATOR_WALLET = new PublicKey(CREATOR_WALLET_B58);

const configPda = PublicKey.findProgramAddressSync([new TextEncoder().encode('config')], PROGRAM_ID)[0];
const curvePda = PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), MINT.toBuffer()], PROGRAM_ID)[0];

// Canonical ATA derivation: [owner, mint, TOKEN_PROGRAM_ID]
const curveAta = PublicKey.findProgramAddressSync(
  [curvePda.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
)[0];
const traderAta = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
)[0];

console.log('=== ATA Creation ===');
console.log('Config PDA :', configPda.toBase58());
console.log('Curve PDA  :', curvePda.toBase58());
console.log('Curve ATA  :', curveAta.toBase58());
console.log('Trader ATA :', traderAta.toBase58());
console.log('');

// Check existence
const curveAtaInfo = await connection.getAccountInfo(curveAta);
const traderAtaInfo = await connection.getAccountInfo(traderAta);
console.log('Curve ATA exists:', !!curveAtaInfo);
console.log('Trader ATA exists:', !!traderAtaInfo);

if (curveAtaInfo && traderAtaInfo) {
  console.log('\nBoth ATAs exist — nothing to do.');
  process.exit(0);
}

// Check balance
const traderInfo = await connection.getAccountInfo(TRADER);
const traderLamports = traderInfo?.lamports ?? 0;
console.log('\nTrader SOL balance:', (traderLamports / LAMPORTS_PER_SOL).toFixed(4));

// Create missing ATAs
const missing = [];
if (!curveAtaInfo) missing.push({ label: 'curveAta', ata: curveAta, owner: curvePda });
if (!traderAtaInfo) missing.push({ label: 'traderAta', ata: traderAta, owner: TRADER });

for (const { label, ata, owner } of missing) {
  console.log(`\nCreating ${label} (${ata.toBase58()})...`);
  try {
    const ix = createAssociatedTokenAccountInstruction(
      TRADER,    // payer
      owner,     // account owner
      MINT,      // mint
      ATA_PROGRAM_ID  // programId
    );
    const tx = new Transaction({ feePayer: TRADER }).add(ix);
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.sign(kp);
    const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
    console.log(`${label} created: ${sig}`);
  } catch (e) {
    console.error(`${label} creation FAILED:`, e.message);
    if (e.transactionLogs) {
      console.error('Logs:', e.transactionLogs.join('\n'));
    }
    process.exit(1);
  }
}

// Verify
console.log('\n=== Final verification ===');
const [finalCurve, finalTrader] = await Promise.all([
  connection.getAccountInfo(curveAta),
  connection.getAccountInfo(traderAta),
]);
console.log('Curve ATA:', finalCurve ? 'EXISTS ✓' : 'MISSING ✗');
console.log('Trader ATA:', finalTrader ? 'EXISTS ✓' : 'MISSING ✗');

if (finalCurve && finalTrader) {
  console.log('\nBoth ATAs created successfully. Ready for buy.');
}
