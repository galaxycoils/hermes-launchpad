import { Connection, PublicKey } from '@solana/web3.js';
const connection = new Connection('https://devnet.rpcpool.com', 'confirmed');
const PROGRAM_ID = new PublicKey('9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz');
const configPda = PublicKey.findProgramAddressSync([new TextEncoder().encode('config')], PROGRAM_ID)[0];
const info = await connection.getAccountInfo(configPda);
const data = info!.data;
const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
let offset = 8; // discriminator
const admin = new PublicKey(new Uint8Array(data.slice(offset, offset+32))).toBase58(); offset += 32;
const feeWallet = new PublicKey(new Uint8Array(data.slice(offset, offset+32))).toBase58(); offset += 32;
const migrationAuthority = new PublicKey(new Uint8Array(data.slice(offset, offset+32))).toBase58(); offset += 32;
const migrationThreshold = view.getBigUint64(offset, true); offset += 8;
const bump = view.getUint8(offset);
console.log('Config PDA:', configPda.toBase58());
console.log('Admin:', admin);
console.log('Fee Wallet:', feeWallet);
console.log('Migration Authority:', migrationAuthority);
console.log('Migration Threshold:', Number(migrationThreshold)/1e9, 'SOL');
console.log('Bump:', bump);