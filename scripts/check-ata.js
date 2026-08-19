import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import fs from 'fs';

const KP_PATH = '/Users/cmd/.config/solana/id.json';
const kpData = JSON.parse(fs.readFileSync(KP_PATH));
const kp = Keypair.fromSecretKey(new Uint8Array(kpData));
const TRADER = kp.publicKey;

const MINT = new PublicKey('CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA');
const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

const connection = new Connection('https://devnet.rpcpool.com', 'confirmed');

const hermesAta = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()],
  ATA_PROGRAM_ID
)[0];

const splAta = getAssociatedTokenAddressSync(MINT, TRADER, false, TOKEN_PROGRAM_ID, ATA_PROGRAM_ID);

console.log('Hermes ATA:', hermesAta.toBase58());
console.log('spl-token ATA:', splAta.toBase58());
console.log('Same?', hermesAta.equals(splAta));

const hermesInfo = await connection.getAccountInfo(hermesAta);
const splInfo = await connection.getAccountInfo(splAta);

console.log('\n--- Hermes ATA ---');
if (hermesInfo) {
  console.log('  owner:', hermesInfo.owner.toBase58());
  console.log('  lamports:', hermesInfo.lamports);
  console.log('  dataLen:', hermesInfo.data.length);
  console.log('  executable:', hermesInfo.executable);
} else {
  console.log('  null (no account)');
}

console.log('\n--- spl-token ATA ---');
if (splInfo) {
  console.log('  owner:', splInfo.owner.toBase58());
  console.log('  lamports:', splInfo.lamports);
  console.log('  dataLen:', splInfo.data.length);
  console.log('  executable:', splInfo.executable);
} else {
  console.log('  null (no account)');
}
