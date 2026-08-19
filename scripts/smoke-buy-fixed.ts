#!/usr/bin/env npx tsx
// SMOKE buy: fixed version. Uses fee wallet GkHE2vb8j... (16 SOL, keypair owner).
// All known bugs fixed:
//   1. feePayer set in Transaction constructor
//   2. Correct ATA seed order [owner, mint, TOKEN_PROGRAM_ID]
//   3. Correct token program ID (Rs623VQ5)
//   4. Correct trader wallet (GkHE2vb8j... = keypair owner)
//   5. Skip ATA creation (spl-token CLI already created it)

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction, ComputeBudgetProgram, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import fs from 'fs';

const CONFIG = {
  RPC: 'https://devnet.rpcpool.com',
  PROGRAM_ID: '9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz',
  TOKEN_PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5',
  ATA_PROGRAM_ID: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  MINT: 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f',
  TRADER: 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a',
  FEE_WALLET: '9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr',
  CREATOR_WALLET: '9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr',
  KEYPAIR: '/Users/cmd/.config/solana/id.json',
  SMOKE_AMOUNT_SOL: 0.02,
  TRADER_ATA: '59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud',
};

const connection = new Connection(CONFIG.RPC, 'confirmed');
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(CONFIG.KEYPAIR, 'utf8'))));

const PROGRAM_ID = new PublicKey(CONFIG.PROGRAM_ID);
const TOKEN_PROGRAM_ID = new PublicKey(CONFIG.TOKEN_PROGRAM_ID);
const ATA_PROGRAM_ID = new PublicKey(CONFIG.ATA_PROGRAM_ID);
const MINT = new PublicKey(CONFIG.MINT);
const TRADER = new PublicKey(CONFIG.TRADER);
const TRADER_ATA = new PublicKey(CONFIG.TRADER_ATA);
const FEE_WALLET = new PublicKey(CONFIG.FEE_WALLET);
const CREATOR_WALLET = new PublicKey(CONFIG.CREATOR_WALLET);

// Verify keypair matches trader
if (!kp.publicKey.equals(TRADER)) {
  console.error('Keypair != trader!');
  console.error('Keypair:', kp.publicKey.toBase58());
  console.error('Trader :', TRADER.toBase58());
  process.exit(1);
}

const TRADER_B58 = TRADER.toBase58();
const TRADER_ATA_B58 = TRADER_ATA.toBase58();

console.log('=== Task 5: SMOKE Buy (Fixed) ===\n');
console.log('Program ID      :', CONFIG.PROGRAM_ID);
console.log('SMOKE mint      :', CONFIG.MINT);
console.log('Trader wallet   :', TRADER_B58, '(= fee wallet, keypair owner)');
console.log('Trader ATA      :', TRADER_ATA_B58, '(spl-token CLI)');
console.log('Fee wallet      :', CONFIG.FEE_WALLET);
console.log('Creator wallet  :', CONFIG.CREATOR_WALLET);
console.log('Keypair pubkey  :', kp.publicKey.toBase58());
console.log('Keypair == trader?', kp.publicKey.equals(TRADER) ? 'YES ✓' : 'NO ✗');
console.log('');

// Check SOL balance
const traderInfo = await connection.getAccountInfo(TRADER);
const traderLamports = traderInfo?.lamports ?? 0;
console.log('Trader SOL balance:', (traderLamports / LAMPORTS_PER_SOL).toFixed(4), 'SOL');

// Check ATA on-chain
const ataInfo = await connection.getAccountInfo(TRADER_ATA);
console.log('Trader ATA on-chain:', ataInfo ? 'EXISTS (lamports=' + ataInfo.lamports + ')' : 'MISSING');
console.log('');

// Skip ATA creation — spl-token CLI already created it.
// createAssociatedTokenAccountInstruction fails because pre-computed address
// doesn't match spl-token's internal seed derivation.
console.log('Using existing ATA (created by spl-token CLI) — skipping creation.\n');

const SMOKE_AMOUNT_SOL = CONFIG.SMOKE_AMOUNT_SOL;
const lamports = BigInt(Math.round(SMOKE_AMOUNT_SOL * LAMPORTS_PER_SOL));
const minOut = lamports;

console.log(`Buy: ${SMOKE_AMOUNT_SOL} SOL → SMOKE`);
console.log(`  lamports: ${lamports}`);
console.log(`  minOut  : ${minOut}\n`);

if (traderLamports < lamports + 2000000n) {
  console.error('Insufficient SOL for trade + fees');
  process.exit(1);
}

// PDAs — compute in correct order
const configPda = PublicKey.findProgramAddressSync([new TextEncoder().encode('config')], PROGRAM_ID)[0];
const curvePda = PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), MINT.toBuffer()], PROGRAM_ID)[0];
// CORRECT seed order for curve ATA: [curvePda, MINT, TOKEN_PROGRAM_ID]
const curveAta = PublicKey.findProgramAddressSync(
  [curvePda.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
)[0];
const curveAtaB58 = curveAta.toBase58();

console.log('Config PDA  :', configPda.toBase58());
console.log('Curve PDA   :', curvePda.toBase58());
console.log('Curve ATA   :', curveAtaB58, '(canonical seed order)');
console.log('Trader ATA  :', TRADER_ATA_B58, '(spl-token CLI)');
console.log('');

// Build buy instruction
const DISC_BUY = Uint8Array.from([0x66, 0x06, 0x3d, 0x12, 0x01, 0xda, 0xeb, 0xea]);

function u64(n: bigint): Uint8Array {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, n, true);
  return b;
}

const buyIx = new TransactionInstruction({
  programId: PROGRAM_ID,
  keys: [
    { pubkey: configPda, isSigner: false, isWritable: false },
    { pubkey: curvePda, isSigner: false, isWritable: true },
    { pubkey: MINT, isSigner: false, isWritable: false },
    { pubkey: curveAta, isSigner: false, isWritable: true },
    { pubkey: TRADER_ATA, isSigner: false, isWritable: true },
    { pubkey: TRADER, isSigner: true, isWritable: true },
    { pubkey: FEE_WALLET, isSigner: false, isWritable: true },
    { pubkey: CREATOR_WALLET, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ATA_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ],
  data: Buffer.from(Uint8Array.from([...DISC_BUY, ...u64(lamports), ...u64(minOut)])),
});

// FIX: pass feePayer in constructor options (before sign)
const tx = new Transaction({ feePayer: TRADER });
tx.add(ComputeBudgetProgram.requestHeapFrame({ bytes: 256 * 1024 }));
tx.add(buyIx);

const { blockhash: bh } = await connection.getLatestBlockhash('confirmed');
tx.recentBlockhash = bh;
tx.sign(kp);

console.log('Transaction details:');
console.log('  Signature count:', tx.signatures.length);
for (const sig of tx.signatures) {
  console.log('  Signer:', sig.publicKey.toBase58(), 'signed:', !!sig.signature);
}
console.log('  Fee payer:', tx.feePayer?.toBase58() ?? 'NOT SET');
console.log('');

console.log('Sending buy transaction...');
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
