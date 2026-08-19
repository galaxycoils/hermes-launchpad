import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://devnet.rpcpool.com', 'confirmed');
const PROGRAM_ID = new PublicKey('9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz');

const configPda = PublicKey.findProgramAddressSync(
  [new TextEncoder().encode('config')],
  PROGRAM_ID
)[0];

const info = await connection.getAccountInfo(configPda);
if (!info) {
  console.log('Config not found');
  process.exit(1);
}

const d = info.data;
// Config: disc(8) + admin(32) + fee_wallet(32) + migration_authority(32) + threshold(8) + bump(1) = 113
const admin = new PublicKey(d.slice(8, 40));
const feeWallet = new PublicKey(d.slice(40, 72));
const migrationAuth = new PublicKey(d.slice(72, 104));
const threshold = BigInt(new DataView(d.buffer, d.byteOffset + 104, 8).getBigUint64(0, true));
const bump = d[112];

console.log('Config PDA     :', configPda.toBase58());
console.log('Admin          :', admin.toBase58());
console.log('Fee wallet     :', feeWallet.toBase58());
console.log('Migration auth :', migrationAuth.toBase58());
console.log('Threshold      :', threshold.toString());
console.log('Bump           :', bump);
console.log('');
console.log('Your trader    : GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a');
console.log('Match feeWallet?', feeWallet.toBase58() === 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a' ? 'YES' : 'NO');
