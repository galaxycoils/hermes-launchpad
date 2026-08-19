#!/usr/bin/env npx tsx
// Build ATA creation instruction manually using the CORRECT on-chain token program.
// The spl-token library has a typo in its TOKEN_PROGRAM_ID constant (f9Ss623).
// We use f9Ss623 to match what the ATA program internally validates.

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import fs from 'fs';

const RPC = 'https://devnet.rpcpool.com';
const MINT_B58 = 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f';
const TRADER_B58 = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const KEYPAIR_PATH = '/Users/cmd/.config/solana/id.json';

// Use f9Ss623 to match the ATA program's internal derivation (this is the
// constant the spl-token library AND the on-chain ATA program use)
const TOKEN_PROGRAM_ID_B58 = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ASSOCIATED_TOKEN_PROGRAM_ID_B58 = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

const connection = new Connection(RPC, 'confirmed');
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8'))));

const MINT = new PublicKey(MINT_B58);
const TRADER = new PublicKey(TRADER_B58);
const TOKEN_PROGRAM_ID = new PublicKey(TOKEN_PROGRAM_ID_B58);
const ATA_PROGRAM_ID = new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID_B58);

// Derive address using f9Ss623 (matches ATA program's internal derivation)
const traderAta = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()],
  ATA_PROGRAM_ID
)[0];

console.log('Pre-computed traderAta:', traderAta.toBase58());
console.log('On-chain spl-token ATA: 59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud');
console.log('Match:', traderAta.toBase58() === '59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud' ? 'YES ✓' : 'NO ✗');

const existing = await connection.getAccountInfo(traderAta);
console.log('On-chain exists:', !!existing);
if (existing) {
  console.log('Already exists — nothing to do.');
  process.exit(0);
}

// Build instruction with f9Ss623 as token program key
const ix = new TransactionInstruction({
  programId: ATA_PROGRAM_ID,
  keys: [
    { pubkey: TRADER, isSigner: true, isWritable: true },
    { pubkey: traderAta, isSigner: false, isWritable: true },
    { pubkey: TRADER, isSigner: false, isWritable: false },
    { pubkey: MINT, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // f9Ss623
  ],
  data: Buffer.from(Uint8Array.from([0x00])),
});

console.log('\nInstruction programId:', ix.programId.toBase58());
console.log('Token program key:', ix.keys[5].pubkey.toBase58());

const tx = new Transaction({ feePayer: TRADER }).add(ix);
const { blockhash } = await connection.getLatestBlockhash('confirmed');
tx.recentBlockhash = blockhash;
tx.sign(kp);

console.log('\nSending...');
const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
console.log('Created:', sig);

const info = await connection.getAccountInfo(traderAta);
console.log('Verified EXISTS:', !!info, '| lamports:', info?.lamports);
