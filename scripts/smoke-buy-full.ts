#!/usr/bin/env npx tsx
// Create curve ATA on devnet if missing, then execute SMOKE buy.
// Uses fee wallet GkHE2vb8j... (16 SOL, keypair owner).

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction, ComputeBudgetProgram, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import fs from 'fs';

const CONFIG = {
  RPC: 'https://devnet.rpcpool.com',
  PROGRAM_ID: '9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz',
  TOKEN_PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA',
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

// Compute PDAs
const configPda = PublicKey.findProgramAddressSync([new TextEncoder().encode('config')], PROGRAM_ID)[0];
const curvePda = PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), MINT.toBuffer()], PROGRAM_ID)[0];
const curveAta = PublicKey.findProgramAddressSync(
  [curvePda.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
)[0];

const curveAtaB58 = curveAta.toBase58();
console.log('Config PDA :', configPda.toBase58());
console.log('Curve PDA  :', curvePda.toBase58());
console.log('Curve ATA  :', curveAtaB58);
console.log('Trader ATA :', CONFIG.TRADER_ATA);
console.log('');

// Check curve ATA existence
const curveAtaInfo = await connection.getAccountInfo(curveAta);
if (!curveAtaInfo) {
  console.log('Curve ATA MISSING — creating with spl-token CLI...');
  // Check if fee wallet has the vault account
  const traderInfo = await connection.getAccountInfo(TRADER);
  if (!traderInfo || traderInfo.lamports < 1000000) {
    console.error('Insufficient SOL to create ATA');
    process.exit(1);
  }
  // We need to create the ATA. But spl-token CLI creates for the wallet configured.
  // Let's try the programmatic approach with correct derivation.
  // The issue before was pre-computed address mismatch. Let's try using
  // getAssociatedTokenAddress from spl-token (which does internal derivation correctly)
  // then build the instruction with that address.
  console.log('Attempting programmatic ATA creation...');
  try {
    const { getAssociatedTokenAddressSync: getAtaSync } = await import('@solana/spl-token');
    // Note: spl-token 0.4.x getAssociatedTokenAddressSync signature: (mint, owner)
    // But earlier we got TokenOwnerOffCurveError. Let's try with the fee wallet owner.
    const [computedAta] = getAtaSync?.(MINT, TRADER) || [PublicKey.findProgramAddressSync(
      [TRADER.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
      ATA_PROGRAM_ID
    )[0]];
    console.log('Computed ATA:', computedAta.toBase58());
    console.log('Expected   :', curveAtaB58);
    
    if (computedAta.equals(curveAta)) {
      // Try creating it
      const ix = createAssociatedTokenAccountInstruction(
        kp.publicKey, curveAta, TRADER, MINT, TOKEN_PROGRAM_ID, ATA_PROGRAM_ID,
      );
      const tx = new Transaction({ feePayer: kp.publicKey }).add(ix);
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.sign(kp);
      const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
      console.log('Curve ATA created:', sig);
    } else {
      console.log('Address mismatch — spl-token derives differently. Using CLI instead.');
    }
  } catch (e) {
    console.log('Programmatic creation failed:', e.message);
    console.log('Will try spl-token CLI in next step.');
  }
} else {
  console.log('Curve ATA EXISTS ✓');
}

// Now do the buy
const traderInfo = await connection.getAccountInfo(TRADER);
const traderLamports = traderInfo?.lamports ?? 0;
console.log('\nTrader SOL:', (traderLamports / LAMPORTS_PER_SOL).toFixed(4));

const lamports = BigInt(Math.round(CONFIG.SMOKE_AMOUNT_SOL * LAMPORTS_PER_SOL));
const minOut = lamports;

console.log(`\nBuy: ${CONFIG.SMOKE_AMOUNT_SOL} SOL → SMOKE`);
console.log(`  lamports: ${lamports}`);
console.log(`  minOut  : ${minOut}\n`);

if (traderLamports < lamports + 2000000n) {
  console.error('Insufficient SOL');
  process.exit(1);
}

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

const tx = new Transaction({ feePayer: TRADER });
tx.add(ComputeBudgetProgram.requestHeapFrame({ bytes: 256 * 1024 }));
tx.add(buyIx);

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
