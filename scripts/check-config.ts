import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://devnet.rpcpool.com', 'confirmed');
const PROGRAM_ID = new PublicKey('9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz');

// Config PDA
const configPda = PublicKey.findProgramAddressSync(
  [new TextEncoder().encode('config')],
  PROGRAM_ID
)[0];

console.log('Config PDA:', configPda.toBase58());

const info = await connection.getAccountInfo(configPda);
if (!info) {
  console.log('Config account not found!');
  process.exit(1);
}

console.log('Config owner:', info.owner.toBase58());
console.log('Config data length:', info.data.length);
console.log('Config data (hex):', Buffer.from(info.data).toString('hex'));

// Parse: discriminator(8) + fields...
// Let's dump all 32-byte chunks as potential pubkeys
const d = info.data;
console.log('\nRaw bytes (u64 LE offsets):');
for (let i = 0; i < d.length; i += 8) {
  const slice = d.slice(i, Math.min(i + 8, d.length));
  const val = BigInt(new DataView(slice.buffer, slice.byteOffset, slice.length).getBigUint64(0, true));
  console.log(`  [${i}..${i + slice.length}]: ${val} (0x${val.toString(16)})`);
}

// Also try reading 32-byte aligned pubkeys
console.log('\n32-byte chunks:');
for (let i = 8; i + 32 <= d.length; i += 32) {
  const slice = d.slice(i, i + 32);
  try {
    const pk = new PublicKey(slice);
    console.log(`  [${i}..${i + 32}]: ${pk.toBase58()}`);
  } catch (e) {
    console.log(`  [${i}..${i + 32}]: (not a valid pubkey)`);
  }
}
