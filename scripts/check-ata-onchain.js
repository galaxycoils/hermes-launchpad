#!/usr/bin/env npx tsx
import { PublicKey, Connection } from '@solana/web3.js';

const conn = new Connection('https://devnet.rpcpool.com', 'confirmed');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA');
const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const MINT = new PublicKey('CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f');
const TRADER = new PublicKey('GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a');
const PROGRAM_ID = new PublicKey('9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz');

const curvePda = PublicKey.findProgramAddressSync(
  [new TextEncoder().encode('curve'), MINT.toBuffer()], PROGRAM_ID
)[0];
const curveAta = PublicKey.findProgramAddressSync(
  [curvePda.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
)[0];
const traderAta = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
)[0];

console.log('curvePda:  ', curvePda.toBase58());
console.log('curveAta:  ', curveAta.toBase58());
console.log('traderAta: ', traderAta.toBase58());

const [cInfo, caInfo, taInfo] = await Promise.all([
  conn.getAccountInfo(curvePda),
  conn.getAccountInfo(curveAta),
  conn.getAccountInfo(traderAta),
]);

console.log('');
console.log('curvePda on-chain :', cInfo ? 'EXISTS (lamports=' + cInfo.lamports + ')' : 'MISSING');
console.log('curveAta on-chain :', caInfo ? 'EXISTS (lamports=' + caInfo.lamports + ')' : 'MISSING');
console.log('traderAta on-chain:', taInfo ? 'EXISTS (lamports=' + taInfo.lamports + ')' : 'MISSING');

// Also check the spl-token CLI ATA (59tgQcjN...)
const splTokenAta = new PublicKey('59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud');
const splInfo = await conn.getAccountInfo(splTokenAta);
console.log('');
console.log('spl-token CLI ATA (59tgQcjN...):', splInfo ? 'EXISTS (lamports=' + splInfo.lamports + ')' : 'MISSING');
