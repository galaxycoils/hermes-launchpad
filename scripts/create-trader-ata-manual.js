#!/usr/bin/env npx tsx
// Manually build CreateAssociatedTokenAccount instruction with CORRECT TOKEN_PROGRAM_ID.
// The spl-token library's TOKEN_PROGRAM_ID constant is typo'd (f9Ss623),
// so we build the instruction by hand using the correct f9Rs623VQ5DA.

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import fs from 'fs';

const RPC = 'https://devnet.rpcpool.com';
const MINT_B58 = 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f';
const TRADER_B58 = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const KEYPAIR_PATH = '/Users/cmd/.config/solana/id.json';

// CORRECT values
const TOKEN_PROGRAM_ID_B58 = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA';
const ASSOCIATED_TOKEN_PROGRAM_ID_B58 = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

const connection = new Connection(RPC, 'confirmed');
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8'))));

const MINT = new PublicKey(MINT_B58);
const TRADER = new PublicKey(TRADER_B58);
const TOKEN_PROGRAM_ID = new PublicKey(TOKEN_PROGRAM_ID_B58);
const ATA_PROGRAM_ID = new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID_B58);

// Pre-compute address using CORRECT TOKEN_PROGRAM_ID
const traderAta = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()],
  ATA_PROGRAM_ID
)[0];

console.log('Pre-computed traderAta:', traderAta.toBase58());
console.log('Expected:               8e24Szb7NqbqcymkzoYpATYxZsiK14z8jPXhYFwaUfDp');
console.log('Match:', traderAta.toBase58() === '8e24Szb7NqbqcymkzoYpATYxZsiK14z8jPXhYFwaUfDp' ? 'YES ✓' : 'NO ✗');

const existing = await connection.getAccountInfo(traderAta);
console.log('On-chain exists:', !!existing);
if (existing) {
  console.log('Already exists — nothing to do.');
  process.exit(0);
}

// Build instruction MANUALLY
// Keys per AToken program Create instruction:
//   0: payer (signer, writable)
//   1: associatedToken (writable)
//   2: owner (not signer, not writable)
//   3: mint (not signer, not writable)
//   4: SystemProgram (not signer, not writable)
//   5: tokenProgram (not signer, not writable)
const ix = new TransactionInstruction({
  programId: ATA_PROGRAM_ID,
  keys: [
    { pubkey: TRADER, isSigner: true, isWritable: true },           // payer
    { pubkey: traderAta, isSigner: false, isWritable: true },       // associated token account
    { pubkey: TRADER, isSigner: false, isWritable: false },         // owner
    { pubkey: MINT, isSigner: false, isWritable: false },           // mint
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // CORRECT token program
  ],
  data: Buffer.from(Uint8Array.from([0x00])), // Create (not idempotent)
});

console.log('\nInstruction programId:', ix.programId.toBase58());
console.log('Instruction keys:');
for (let i = 0; i < ix.keys.length; i++) {
  const k = ix.keys[i];
  console.log(`  [${i}] ${k.pubkey.toBase58().slice(0,12)}... sign=${k.isSigner} write=${k.isWritable}`);
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
