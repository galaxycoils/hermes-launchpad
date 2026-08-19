#!/usr/bin/env npx tsx
// Create traderAta for SMOKE mint — owner is TRADER (regular keypair).
// Uses spl-token 0.4.x createAssociatedTokenAccountInstruction.
// The instruction signature is: (owner, mint, payer, programId)

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token';
import fs from 'fs';

const RPC = 'https://devnet.rpcpool.com';
const MINT_B58 = 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f';
const TRADER_B58 = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const KEYPAIR_PATH = '/Users/cmd/.config/solana/id.json';
const TOKEN_PROGRAM_ID_B58 = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA';
const ATA_PROGRAM_ID_B58 = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

const connection = new Connection(RPC, 'confirmed');
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8'))));

const MINT = new PublicKey(MINT_B58);
const TRADER = new PublicKey(TRADER_B58);
const TOKEN_PROGRAM_ID = new PublicKey(TOKEN_PROGRAM_ID_B58);
const ATA_PROGRAM_ID = new PublicKey(ATA_PROGRAM_ID_B58);

// Use spl-token's own address computation
const computedAta = getAssociatedTokenAddressSync(MINT, TRADER);
console.log('spl-token computed ATA:', computedAta.toBase58());
console.log('My canonical computation: 6C2LSwRN8NLxz9DNx2PjSXkAssHeGZt3dx4WSWRrjLZt');
console.log('Match:', computedAta.toBase58() === '6C2LSwRN8NLxz9DNx2PjSXkAssHeGZt3dx4WSWRrjLZt' ? 'YES' : 'NO');

const existing = await connection.getAccountInfo(computedAta);
console.log('On-chain exists:', !!existing);

if (existing) {
  console.log('Already exists — done.');
  process.exit(0);
}

console.log('\nCreating ATA...');
const ix = createAssociatedTokenAccountInstruction(
  TRADER,   // owner
  MINT,     // mint
  TRADER,   // payer
  ATA_PROGRAM_ID  // programId
);
console.log('Instruction keys:');
for (const k of ix.keys) {
  console.log(`  ${k.pubkey.toBase58().slice(0,8)}... sign=${k.isSigner} write=${k.isWritable}`);
}
console.log('programId:', ix.programId.toBase58());

const tx = new Transaction({ feePayer: TRADER }).add(ix);
const { blockhash } = await connection.getLatestBlockhash('confirmed');
tx.recentBlockhash = blockhash;
tx.sign(kp);

const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
console.log('Created:', sig);

const info = await connection.getAccountInfo(computedAta);
console.log('Verified EXISTS:', !!info, '| lamports:', info?.lamports);
