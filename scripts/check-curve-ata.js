#!/usr/bin/env npx tsx
// Check curve PDA + curve ATA existence on devnet.

import { Connection, PublicKey } from '@solana/web3.js';

const conn = new Connection('https://devnet.rpcpool.com', 'confirmed');
const PROGRAM_ID = new PublicKey('9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA');
const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const MINT = new PublicKey('CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f');

const configPda = PublicKey.findProgramAddressSync([new TextEncoder().encode('config')], PROGRAM_ID)[0];
const curvePda = PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), MINT.toBuffer()], PROGRAM_ID)[0];
const curveAta = PublicKey.findProgramAddressSync(
  [curvePda.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
)[0];

console.log('Config PDA :', configPda.toBase58());
console.log('Curve PDA  :', curvePda.toBase58());
console.log('Curve ATA  :', curveAta.toBase58());

const [cInfo, aInfo] = await Promise.all([
  conn.getAccountInfo(curvePda),
  conn.getAccountInfo(curveAta),
]);

console.log('\nCurve PDA :', cInfo ? 'EXISTS (lamports=' + cInfo.lamports + ')' : 'MISSING');
console.log('Curve ATA:', aInfo ? 'EXISTS (lamports=' + aInfo.lamports + ')' : 'MISSING');

if (cInfo) {
  console.log('\nCurve PDA data length:', cInfo.data.length, 'bytes');
  console.log('Curve PDA owner:', cInfo.owner.toBase58());
}

if (aInfo) {
  console.log('\nCurve ATA data length:', aInfo.data.length, 'bytes');
  console.log('Curve ATA owner:', aInfo.owner.toBase58());
}
