#!/usr/bin/env npx tsx
// Create traderAta at the CORRECT address (after TOKEN_PROGRAM_ID fix).
// Correct derivation: [owner, TOKEN_PROGRAM_ID (f9Rs623), mint] → 8e24Szb7N...
// Uses spl-token 0.4.x createAssociatedTokenAccountInstruction with the
// SAME TOKEN_PROGRAM_ID so the instruction creates at the matching address.

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import fs from 'fs';

const RPC = 'https://devnet.rpcpool.com';
const MINT_B58 = 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f';
const TRADER_B58 = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const KEYPAIR_PATH = '/Users/cmd/.config/solana/id.json';
const TOKEN_PROGRAM_ID_B58 = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA'; // CORRECT (Rs623)
const ATA_PROGRAM_ID_B58 = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

const connection = new Connection(RPC, 'confirmed');
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8'))));

const MINT = new PublicKey(MINT_B58);
const TRADER = new PublicKey(TRADER_B58);
const TOKEN_PROGRAM_ID = new PublicKey(TOKEN_PROGRAM_ID_B58);
const ATA_PROGRAM_ID = new PublicKey(ATA_PROGRAM_ID_B58);

// Compute using CORRECT TOKEN_PROGRAM_ID
const traderAta = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()],
  ATA_PROGRAM_ID
)[0];

console.log('Correct traderAta:', traderAta.toBase58());
console.log('spl-token CLI ATA (wrong TOKEN):', '59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud');
console.log('');

const existing = await connection.getAccountInfo(traderAta);
console.log('On-chain exists:', !!existing);
if (existing) {
  console.log('Already exists — nothing to do.');
  process.exit(0);
}

console.log('\nCreating ATA at', traderAta.toBase58(), '...');
console.log('Using TOKEN_PROGRAM_ID:', TOKEN_PROGRAM_ID_B58);

// Use spl-token's instruction with our TOKEN_PROGRAM_ID as programId
// This creates the ATA at the address derived from OUR TOKEN_PROGRAM_ID
const ix = createAssociatedTokenAccountInstruction(
  TRADER,          // owner
  MINT,            // mint
  TRADER,          // payer
  ATA_PROGRAM_ID   // programId (associated token program)
);

console.log('Instruction programId:', ix.programId.toBase58());
console.log('Instruction keys:');
for (const k of ix.keys) {
  console.log(`  ${k.pubkey.toBase58().slice(0,12)}... sign=${k.isSigner} write=${k.isWritable}`);
}

const tx = new Transaction({ feePayer: TRADER }).add(ix);
const { blockhash } = await connection.getLatestBlockhash('confirmed');
tx.recentBlockhash = blockhash;
tx.sign(kp);

console.log('\nSending...');
const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
console.log('Created:', sig);

const info = await connection.getAccountInfo(traderAta);
console.log('Verified EXISTS:', !!info, '| lamports:', info?.lamports);
