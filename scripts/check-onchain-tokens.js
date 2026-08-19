import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Use CLI's configured RPC
const connection = new Connection('https://devnet.rpcpool.com', 'confirmed');

// Check existing SMOKE, HNQ, CX on-chain state
const tokens = [
  { name: 'SMOKE', mint: 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f', creator: 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a' },
  { name: 'HNQ', mint: null, creator: 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a' },
  { name: 'CX', mint: null, creator: '72QRXSyt9TN' },
];

// Get mints from API
const apiTokens = await fetch('https://hermes-api.tahamtandariush.workers.dev/api/tokens').then(r => r.json());

console.log('=== On-chain token state ===\n');

for (const t of apiTokens) {
  if (!t.onchainMint) continue;
  const mint = new PublicKey(t.onchainMint);
  
  // Check mint account
  const mintInfo = await connection.getAccountInfo(mint);
  
  // Compute PDAs
  const PROGRAM_ID = new PublicKey('9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz');
  const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA');
  const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
  
  const configPda = PublicKey.findProgramAddressSync([new TextEncoder().encode('config')], PROGRAM_ID)[0];
  const curvePda = PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), mint.toBuffer()], PROGRAM_ID)[0];
  const curveAta = PublicKey.findProgramAddressSync([curvePda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], ATA_PROGRAM_ID)[0];
  
  const curveInfo = await connection.getAccountInfo(curvePda);
  const curveAtaInfo = await connection.getAccountInfo(curveAta);
  
  console.log(`--- ${t.ticker} (${t.onchainMint.slice(0,8)}...) ---`);
  console.log(`  curvePda: ${curvePda.toBase58().slice(0,8)}... exists: ${!!curveInfo}, len: ${curveInfo?.data?.length}`);
  console.log(`  curveAta: ${curveAta.toBase58().slice(0,8)}... exists: ${!!curveAtaInfo}`);
  if (curveAtaInfo) {
    console.log(`    owner: ${curveAtaInfo.owner.toBase58().slice(0,8)}...`);
    console.log(`    data len: ${curveAtaInfo.data.length}`);
  }
  console.log('');
}
