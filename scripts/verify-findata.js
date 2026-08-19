#!/usr/bin/env npx tsx
import { PublicKey, Connection } from '@solana/web3.js';
import fs from 'fs';

const RPC = 'https://devnet.rpcpool.com';
const MINT_B58 = 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f';
const TRADER_B58 = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const TOKEN_PROGRAM_ID_B58 = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA';
const ATA_PROGRAM_ID_B58 = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

const connection = new Connection(RPC, 'confirmed');
const MINT = new PublicKey(MINT_B58);
const TRADER = new PublicKey(TRADER_B58);
const TOKEN_PROGRAM_ID = new PublicKey(TOKEN_PROGRAM_ID_B58);
const ATA_PROGRAM_ID = new PublicKey(ATA_PROGRAM_ID_B58);

// This is exactly what src/lib/solana.ts:50-54 does (the ORIGINAL, reverted code)
const traderAta = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()],
  ATA_PROGRAM_ID
)[0];

console.log('findAta (solana.ts) derives:', traderAta.toBase58());
console.log('On-chain spl-token ATA:     59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud');
console.log('Match:', traderAta.toBase58() === '59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud' ? 'YES ✓' : 'NO ✗');

const info = await connection.getAccountInfo(traderAta);
console.log('On-chain:', info ? `EXISTS (lamports=${info.lamports})` : 'MISSING');
