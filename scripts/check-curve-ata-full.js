#!/usr/bin/env npx tsx
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';

const RPC = 'https://devnet.rpcpool.com';
const MINT_B58 = 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f';
const TOKEN_PROGRAM_ID_B58 = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ATA_PROGRAM_ID_B58 = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const PROGRAM_ID_B58 = '9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz';

const conn = new Connection(RPC, 'confirmed');
const MINT = new PublicKey(MINT_B58);
const TOKEN_PROGRAM_ID = new PublicKey(TOKEN_PROGRAM_ID_B58);
const ATA_PROGRAM_ID = new PublicKey(ATA_PROGRAM_ID_B58);
const PROGRAM_ID = new PublicKey(PROGRAM_ID_B58);

const configPda = PublicKey.findProgramAddressSync([new TextEncoder().encode('config')], PROGRAM_ID)[0];
const curvePda = PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), MINT.toBuffer()], PROGRAM_ID)[0];

// Curve ATA derivations with f9Ss623
const curveAta_v1 = PublicKey.findProgramAddressSync(
  [curvePda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()],
  ATA_PROGRAM_ID
)[0];
const curveAta_v2 = PublicKey.findProgramAddressSync(
  [curvePda.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
)[0];

console.log('Config PDA :', configPda.toBase58());
console.log('Curve PDA  :', curvePda.toBase58());
console.log('');
console.log('Curve ATA  [curvePda, TOKEN, mint] (script current):', curveAta_v1.toBase58());
console.log('Curve ATA  [curvePda, mint, TOKEN]                   :', curveAta_v2.toBase58());
console.log('');

const [cInfo, ca1Info, ca2Info] = await Promise.all([
  conn.getAccountInfo(curvePda),
  conn.getAccountInfo(curveAta_v1),
  conn.getAccountInfo(curveAta_v2),
]);

console.log('Curve PDA on-chain   :', cInfo ? `EXISTS (lamports=${cInfo.lamports}, owner=${cInfo.owner.toBase58()})` : 'MISSING');
console.log('Curve ATA v1 on-chain:', ca1Info ? `EXISTS (lamports=${ca1Info.lamports})` : 'MISSING');
console.log('Curve ATA v2 on-chain:', ca2Info ? `EXISTS (lamports=${ca2Info.lamports})` : 'MISSING');

// Also check existing SMOKE/HNQ/CX on-chain to see how their curve ATAs were created
const existingMints = [
  { name: 'SMOKE', mint: 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f' },
];
for (const { name, mint } of existingMints) {
  const m = new PublicKey(mint);
  const cp = PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), m.toBuffer()], PROGRAM_ID)[0];
  const cpInfo = await conn.getAccountInfo(cp);
  console.log(`\n${name} curve PDA (${cp.toBase58().slice(0,8)}...):`, cpInfo ? `EXISTS owner=${cpInfo.owner.toBase58()}` : 'MISSING');
  if (cpInfo && cpInfo.data.length > 0) {
    console.log('  data length:', cpInfo.data.length, 'bytes');
    // Check if this PDA has any token accounts associated
  }
}
