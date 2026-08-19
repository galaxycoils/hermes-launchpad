#!/usr/bin/env npx tsx
// Create ATAs for owner that is a PDA (curvePda), not a regular keypair.
// The curve ATA owner is curvePda (a program-derived address), which is NOT a wallet.
// ATA creation requires the OWNER to sign — PDAs can't sign.
// 
// The curve ATA must be created by the PROGRAM (Hermes) via a CPI, OR
// we need to use a different approach: create the ATA with a regular keypair
// as the "owner" of the ATA account, but the ATA address must match what
// the program expects.
//
// Actually — ATAs for PDAs don't make sense in the normal flow.
// The curve PDA's token account would be created by the program itself
// when initialize/createToken is called. It's not a user ATA.
//
// Let me check: does the Hermes program CREATE the curve ATA itself during
// createToken? If so, the curve ATA should already exist after createToken.
// But we confirmed curveAta is MISSING on-chain — meaning createToken was
// never called for SMOKE, OR the program doesn't create it.
//
// Let me look at what the program actually does with curveAta.

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import fs from 'fs';

const RPC = 'https://devnet.rpcpool.com';
const MINT_B58 = 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f';
const TRADER_B58 = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const KEYPAIR_PATH = '/Users/cmd/.config/solana/id.json';
const PROGRAM_ID_B58 = '9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz';
const TOKEN_PROGRAM_ID_B58 = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA';
const ATA_PROGRAM_ID_B58 = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

const connection = new Connection(RPC, 'confirmed');
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8'))));

const PROGRAM_ID = new PublicKey(PROGRAM_ID_B58);
const TOKEN_PROGRAM_ID = new PublicKey(TOKEN_PROGRAM_ID_B58);
const ATA_PROGRAM_ID = new PublicKey(ATA_PROGRAM_ID_B58);
const MINT = new PublicKey(MINT_B58);
const TRADER = new PublicKey(TRADER_B58);

const traderAta = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
)[0];

console.log('Trader ATA:', traderAta.toBase58());
console.log('Already exists:', !!(await connection.getAccountInfo(traderAta)));

// Create trader ATA — owner is a regular keypair (TRADER), so this should work
console.log('\nCreating traderAta with payer=TRADER, owner=TRADER...');
const tx = new Transaction({ feePayer: TRADER });
const ix = new TransactionInstruction({
  programId: ATA_PROGRAM_ID,
  keys: [
    { pubkey: traderAta, isSigner: false, isWritable: true },
    { pubkey: TRADER, isSigner: true, isWritable: true },
    { pubkey: TRADER, isSigner: true, isWritable: true }, // wallet (payer)
    { pubkey: MINT, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ],
  data: Buffer.from(Uint8Array.from([0x00])),
});
tx.add(ix);

const { blockhash } = await connection.getLatestBlockhash('confirmed');
tx.recentBlockhash = blockhash;
tx.sign(kp);

console.log('Sending...');
const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
console.log('Trader ATA created:', sig);

const info = await connection.getAccountInfo(traderAta);
console.log('Verified EXISTS:', !!info, '| lamports:', info?.lamports);
