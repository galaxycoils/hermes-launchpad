#!/usr/bin/env npx tsx
// SMOKE buy using fee wallet as trader.
// Trader signs + pays fees. Fee wallet = creator wallet = program config payout.

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction, ComputeBudgetProgram, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import fs from 'fs';

const CONF = {
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
};

const conn = new Connection(CONF.RPC, 'confirmed');
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(CONF.KEYPAIR, 'utf8'))));

const TRADER = new PublicKey(CONF.TRADER);
const FEE_WALLET = new PublicKey(CONF.FEE_WALLET);
const CREATOR_WALLET = new PublicKey(CONF.CREATOR_WALLET);
const MINT = new PublicKey(CONF.MINT);
const PROGRAM_ID = new PublicKey(CONF.PROGRAM_ID);
const TOKEN_PROGRAM_ID = new PublicKey(CONF.TOKEN_PROGRAM_ID);
const ATA_PROGRAM_ID = new PublicKey(CONF.ATA_PROGRAM_ID);

// CLI-created canonical ATA
const TRADER_ATA = new PublicKey('59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud');

console.log('=== Task 5: SMOKE Buy ===\n');
console.log('  Program ID     :', CONF.PROGRAM_ID);
console.log('  SMOKE mint     :', CONF.MINT);
console.log('  Trader wallet  :', TRADER.toBase58());
console.log('  Trader ATA     :', TRADER_ATA.toBase58());
console.log('  Fee wallet     :', CONF.FEE_WALLET);
console.log('  Creator wallet :', CONF.CREATOR_WALLET);
console.log('  Keypair pubkey :', kp.publicKey.toBase58());
console.log('  Keypair == trader?', kp.publicKey.equals(TRADER) ? 'YES ✓' : 'NO ✗');
console.log('');

// Check SOL balance
const tInfo = await conn.getAccountInfo(TRADER);
const tLamports = tInfo?.lamports ?? 0;
console.log('  Trader SOL:', (tLamports / LAMPORTS_PER_SOL).toFixed(4));

// Verify ATA on-chain
const aInfo = await conn.getAccountInfo(TRADER_ATA);
if (!aInfo) { console.error('ATA not on-chain — abort'); process.exit(1); }
console.log('  ATA on-chain: lamports=' + aInfo.lamports + ', dataLen=' + aInfo.data.length);
console.log('');

const amount = BigInt(Math.round(CONF.SMOKE_AMOUNT_SOL * LAMPORTS_PER_SOL));
const minOut = amount;
console.log(`  Buy: ${CONF.SMOKE_AMOUNT_SOL} SOL -> SMOKE`);
console.log(`  lamports: ${amount}`);
console.log(`  minOut  : ${minOut}\n`);

// Build buy instruction
const DISC_BUY = Uint8Array.from([0x66, 0x06, 0x3d, 0x12, 0x01, 0xda, 0xeb, 0xea]);
const u64 = (n: bigint) => { const b = new Uint8Array(8); new DataView(b.buffer).setBigUint64(0, n, true); return b; };

const configPda = PublicKey.findProgramAddressSync([new TextEncoder().encode('config')], PROGRAM_ID)[0];
const curvePda = PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), MINT.toBuffer()], PROGRAM_ID)[0];

const buyIx = new TransactionInstruction({
  programId: PROGRAM_ID,
  keys: [
    { pubkey: configPda, isSigner: false, isWritable: false },
    { pubkey: curvePda, isSigner: false, isWritable: true },
    { pubkey: MINT, isSigner: false, isWritable: false },
    { pubkey: TRADER_ATA, isSigner: false, isWritable: true },
    { pubkey: TRADER, isSigner: true, isWritable: true },
    { pubkey: FEE_WALLET, isSigner: false, isWritable: true },
    { pubkey: CREATOR_WALLET, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ATA_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ],
  data: Buffer.from(Uint8Array.from([...DISC_BUY, ...u64(amount), ...u64(minOut)])),
});

const tx = new Transaction();
tx.add(ComputeBudgetProgram.requestHeapFrame({ bytes: 256 * 1024 }));
tx.add(buyIx);
tx.feePayer = TRADER;
const { blockhash: bh } = await conn.getLatestBlockhash('confirmed');
tx.recentBlockhash = bh;
tx.sign(kp);

console.log('  Sending buy...');
try {
  const sig = await sendAndConfirmTransaction(conn, tx, [kp], { commitment: 'confirmed' });
  console.log('\n  === BUY CONFIRMED ===\n');
  console.log('  Signature:', sig);
  console.log('  Explorer: https://explorer.solana.com/tx/' + sig + '?cluster=devnet');
  fs.writeFileSync('/tmp/smoke-buy-sig.txt', sig);
  console.log('  Sig saved: /tmp/smoke-buy-sig.txt');
} catch (e: any) {
  console.error('\n  BUY FAILED:', e.message);
  if (e.transactionLogs) console.error('  Logs:', e.transactionLogs.join('\n'));
  process.exit(1);
}
