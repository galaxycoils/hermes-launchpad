import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, ComputeBudgetProgram, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';

const PROGRAM_ID = new PublicKey('9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA');
const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

const MINT = new PublicKey('CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f');
const FEE_WALLET = new PublicKey('GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a');
const CREATOR_WALLET = FEE_WALLET;

const KP_PATH = '/Users/cmd/.config/solana/id.json';
const kpData = JSON.parse(fs.readFileSync(KP_PATH));
const kp = Keypair.fromSecretKey(new Uint8Array(kpData));
const TRADER = kp.publicKey;

const connection = new Connection('https://devnet.rpcpool.com', 'confirmed');

// PDA computation
const configPda = PublicKey.findProgramAddressSync([new TextEncoder().encode('config')], PROGRAM_ID)[0];
const curvePda = PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), MINT.toBuffer()], PROGRAM_ID)[0];
const curveAta = PublicKey.findProgramAddressSync([curvePda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()], ATA_PROGRAM_ID)[0];
const traderAta = PublicKey.findProgramAddressSync([TRADER.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()], ATA_PROGRAM_ID)[0];

console.log('=== PDAs ===');
console.log('configPda:', configPda.toBase58());
console.log('curvePda:', curvePda.toBase58());
console.log('curveAta:', curveAta.toBase58());
console.log('traderAta:', traderAta.toBase58());
console.log('TRADER:', TRADER.toBase58());
console.log('FEE_WALLET:', FEE_WALLET.toBase58());
console.log('CREATOR_WALLET:', CREATOR_WALLET.toBase58());

// Check what exists
const checks = {
  'configPda': configPda,
  'curvePda': curvePda,
  'curveAta': curveAta,
  'traderAta': traderAta,
};
for (const [name, pubkey] of Object.entries(checks)) {
  const info = await connection.getAccountInfo(pubkey);
  console.log(`${name} (${pubkey.toBase58().slice(0,8)}...): exists=${!!info}, dataLen=${info?.data?.length ?? 'N/A'}, owner=${info?.owner?.toBase58().slice(0,8)}...`);
}

// Check SMOKE mint
const mintInfo = await connection.getAccountInfo(MINT);
console.log('\nSMOKE mint:', mintInfo ? 'exists' : 'NOT FOUND', '| owner:', mintInfo?.owner.toBase58().slice(0,8) + '...');
console.log('SMOKE mint data (hex):', mintInfo?.data?.toString('hex') ?? 'N/A');

// The curve PDA should have been created by createToken
// Let's check if it exists
console.log('\n=== Checking curve PDA ownership ===');
const curveInfo = await connection.getAccountInfo(curvePda);
if (curveInfo) {
  console.log('curvePda exists, owner:', curveInfo.owner.toBase58());
  console.log('curvePda data length:', curveInfo.data.length);
} else {
  console.log('curvePda DOES NOT EXIST - needs initialization');
}

// Also check who owns the SMOKE mint - this tells us who created it
console.log('\n=== Mint authority check ===');
// Token accounts have mint as owner (Tokenkeg...)
// But we need to check the curve PDA to see if it's initialized
