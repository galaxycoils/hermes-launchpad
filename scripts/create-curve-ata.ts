#!/usr/bin/env npx tsx
// Create curve ATA on devnet — program-owned ATA for curve PDA.
// Owner = curve PDA (2hbzCUfNq...), payer = fee wallet GkHE2vb8j... (keypair).
// Uses Token-2022 program ID since SMOKE mint uses Token-2022.

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import fs from 'fs';

const CONFIG = {
  RPC: 'https://devnet.rpcpool.com',
  PROGRAM_ID: '9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz',
  // Token-2022 — SMOKE mint owner is Token-2022, not legacy Token
  TOKEN_PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  ATA_PROGRAM_ID: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  MINT: 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f',
  TRADER: 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a',
  FEE_WALLET: '9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr',
  KEYPAIR: '/Users/cmd/.config/solana/id.json',
};

const connection = new Connection(CONFIG.RPC, 'confirmed');
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(CONFIG.KEYPAIR, 'utf8'))));

const PROGRAM_ID = new PublicKey(CONFIG.PROGRAM_ID);
const TOKEN_PROGRAM_ID = new PublicKey(CONFIG.TOKEN_PROGRAM_ID);
const ATA_PROGRAM_ID = new PublicKey(CONFIG.ATA_PROGRAM_ID);
const MINT = new PublicKey(CONFIG.MINT);
const TRADER = new PublicKey(CONFIG.TRADER);

const curvePda = PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), MINT.toBuffer()], PROGRAM_ID)[0];
const curveAta = PublicKey.findProgramAddressSync(
  [curvePda.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
)[0];

console.log('=== Create Curve ATA (Token-2022) ===');
console.log('Curve PDA  :', curvePda.toBase58());
console.log('Mint       :', MINT);
console.log('Token Prog :', TOKEN_PROGRAM_ID.toBase58(), '(Token-2022)');
console.log('Curve ATA  :', curveAta.toBase58());
console.log('');

// Check if curve ATA already exists
const existingInfo = await connection.getAccountInfo(curveAta);
if (existingInfo) {
  console.log('Curve ATA ALREADY EXISTS:', existingInfo.lamports, 'lamports');
  console.log('No action needed.');
  process.exit(0);
}

console.log('Curve ATA MISSING — creating with Token-2022 program ID...');

const rent = await connection.getMinimumBalanceForRentExemption(0);

const ix = new TransactionInstruction({
  programId: ATA_PROGRAM_ID,
  keys: [
    { pubkey: kp.publicKey, isSigner: true, isWritable: true },       // payer
    { pubkey: curveAta, isSigner: false, isWritable: true },          // associated_token_account
    { pubkey: curvePda, isSigner: false, isWritable: false },         // owner (seed)
    { pubkey: MINT, isSigner: false, isWritable: false },             // mint (seed)
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program (seed)
  ],
  data: Buffer.alloc(0),
});

const tx = new Transaction({ feePayer: kp.publicKey });
tx.add(ix);

const { blockhash } = await connection.getLatestBlockhash('confirmed');
tx.recentBlockhash = blockhash;
tx.sign(kp);

console.log('Sending ATA creation...');
try {
  const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
  console.log('Curve ATA CREATED:', sig);
  console.log('Explorer: https://explorer.solana.com/tx/' + sig + '?cluster=devnet');
} catch (e: any) {
  console.error('FAILED:', e.message);
  console.error('Logs:', e.transactionLogs?.join('\n') || '');
  process.exit(1);
}
