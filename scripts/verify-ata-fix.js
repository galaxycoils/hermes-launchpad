#!/usr/bin/env npx tsx
import { PublicKey, Connection } from '@solana/web3.js';

const conn = new Connection('https://devnet.rpcpool.com', 'confirmed');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA');
const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const MINT = new PublicKey('CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f');
const TRADER = new PublicKey('GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a');

const [correctAta] = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
);

const info = await conn.getAccountInfo(correctAta);
console.log('Canonical ATA:', correctAta.toBase58());
console.log('On-chain:', info ? 'EXISTS (lamports=' + info.lamports + ')' : 'MISSING');
console.log('Hermes expects (WRONG): 8e24Szb7NqbqcymkzoYpATYxZsiK14z8jPXhYFwaUfDp');
console.log('Correct address:         59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud');
console.log('Match:', correctAta.toBase58() === '59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud' ? 'YES' : 'NO');
console.log('');
console.log('FIX: swap TOKEN_PROGRAM_ID and mint in findAta (solana.ts:52)');
console.log('  OLD: [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()]');
console.log('  NEW: [owner.toBuffer(), mint.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()]');
