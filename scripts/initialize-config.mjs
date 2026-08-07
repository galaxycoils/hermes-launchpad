import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram, Keypair } from '@solana/web3.js';
import { Buffer } from 'buffer';
import fs from 'fs';

const PROGRAM_ID = new PublicKey('9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz');
const RPC_URL = 'https://api.devnet.solana.com';

const connection = new Connection(RPC_URL, 'confirmed');

// Deployer keypair (from CLI config)
const keypairData = JSON.parse(fs.readFileSync('/Users/cmd/.config/solana/id.json', 'utf8'));
const admin = Keypair.fromSecretKey(new Uint8Array(keypairData));

// Find config PDA
const [configPda, configBump] = PublicKey.findProgramAddressSync(
  [Buffer.from('config')],
  PROGRAM_ID
);

console.log('Config PDA:', configPda.toBase58());
console.log('Admin:', admin.publicKey.toBase58());

// Use deployer as fee_wallet and migration_authority for now
const feeWallet = admin.publicKey;
const migrationAuthority = admin.publicKey;

// Build initialize instruction
// Discriminator for initialize: sha256("global:initialize")[0..8]
// From solana.ts: [0xaf, 0xaf, 0x6d, 0x1f, 0x0d, 0x98, 0x9b, 0xed]
const DISC_INIT = Buffer.from([0xaf, 0xaf, 0x6d, 0x1f, 0x0d, 0x98, 0x9b, 0xed]);

// Args: migration_threshold_lamports (u64, little-endian)
// 85 SOL = 85_000_000_000 lamports
const threshold = 85_000_000_000;
const thresholdBuf = Buffer.alloc(8);
thresholdBuf.writeBigUInt64LE(BigInt(threshold));

const data = Buffer.concat([DISC_INIT, thresholdBuf]);

const ix = new TransactionInstruction({
  programId: PROGRAM_ID,
  keys: [
    { pubkey: configPda, isSigner: false, isWritable: true },
    { pubkey: admin.publicKey, isSigner: true, isWritable: true },
    { pubkey: feeWallet, isSigner: false, isWritable: false },
    { pubkey: migrationAuthority, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ],
  data,
});

const tx = new Transaction().add(ix);
tx.feePayer = admin.publicKey;
tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

// Sign and send
tx.partialSign(admin);
const sig = await connection.sendRawTransaction(tx.serialize(), {
  skipPreflight: false,
  preflightCommitment: 'confirmed',
});

console.log('Initialize tx signature:', sig);

await connection.confirmTransaction(sig, 'confirmed');
console.log('Initialize confirmed!');

// Verify config account
const configInfo = await connection.getAccountInfo(configPda);
if (configInfo) {
  console.log('Config account exists! Owner:', configInfo.owner.toBase58());
  // Parse the config data
  const dataView = new DataView(configInfo.data.buffer, configInfo.data.byteOffset, configInfo.data.byteLength);
  let offset = 8; // skip discriminator
  const adminPk = new PublicKey(configInfo.data.slice(offset, offset + 32)); offset += 32;
  const feeWalletPk = new PublicKey(configInfo.data.slice(offset, offset + 32)); offset += 32;
  const migrationAuthorityPk = new PublicKey(configInfo.data.slice(offset, offset + 32)); offset += 32;
  const migrationThreshold = Number(dataView.getBigUint64(offset, true)); offset += 8;
  const bump = configInfo.data[offset];
  
  console.log('Config parsed:');
  console.log('  admin:', adminPk.toBase58());
  console.log('  fee_wallet:', feeWalletPk.toBase58());
  console.log('  migration_authority:', migrationAuthorityPk.toBase58());
  console.log('  migration_threshold_lamports:', migrationThreshold);
  console.log('  bump:', bump);
} else {
  console.log('Config account NOT found!');
}

process.exit(0);
