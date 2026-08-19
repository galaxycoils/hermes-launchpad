import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction, ComputeBudgetProgram, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import fs from 'fs';

const PROGRAM_ID = new PublicKey('9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

const MINT = new PublicKey('CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f');
const FEE_WALLET = new PublicKey('GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a');
const CREATOR_WALLET = FEE_WALLET;

const KP_PATH = '/Users/cmd/.config/solana/id.json';
const kpData = JSON.parse(fs.readFileSync(KP_PATH));
const kp = Keypair.fromSecretKey(new Uint8Array(kpData));
const TRADER = kp.publicKey;

const connection = new Connection('https://devnet.rpcpool.com', 'confirmed');

// Compute trader ATA
const traderAta = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()],
  ATA_PROGRAM_ID
)[0];

console.log('=== Step 1: Create trader ATA ===');
console.log('traderAta:', traderAta.toBase58());
const existing = await connection.getAccountInfo(traderAta);
console.log('exists:', !!existing);

if (!existing) {
  const ataIx = createAssociatedTokenAccountInstruction(
    kp.publicKey,   // payer
    traderAta,      // associatedToken
    TRADER,         // owner
    MINT,           // mint
    TOKEN_PROGRAM_ID,
    ATA_PROGRAM_ID
  );

  console.log('Instruction programId:', ataIx.programId.toBase58());
  console.log('Keys:', ataIx.keys.length);

  const tx = new Transaction().add(ataIx);
  tx.feePayer = TRADER;

  const { blockhash: bh } = await connection.getLatestBlockhash();
  tx.recentBlockhash = bh;
  tx.sign(kp);

  console.log('Sending ATA creation...');
  try {
    const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
    console.log('ATA CREATED! Sig:', sig);

    const verify = await connection.getAccountInfo(traderAta);
    console.log('Now exists:', !!verify);
  } catch (e) {
    console.log('FAILED:', e.message);
    console.log('Logs:', (e.transactionLogs || []).join('\n'));
  }
}

// --- BUY ---
if (await connection.getAccountInfo(traderAta)) {
  console.log('\n=== Step 2: Buy 0.02 SOL SMOKE ===');

  const V_SOL0 = 30_000_000_000n;
  const V_TOK0 = 1_073_000_000_000_000n;
  const FEE_BPS = 25n;
  const BPS_DENOM = 10_000n;

  const amountSol = 0.02;
  const lamports = BigInt(Math.round(amountSol * LAMPORTS_PER_SOL));
  const fee = (lamports * FEE_BPS * 2n) / BPS_DENOM;
  const solAfterFees = lamports - fee;
  const k = BigInt(V_SOL0) * BigInt(V_TOK0);
  const newVs = BigInt(V_SOL0) + solAfterFees;
  const newVt = k / newVs;
  const tokOut = BigInt(V_TOK0) - newVt;
  const minOut = (tokOut * 99n) / 100n;

  console.log(`  lamports: ${lamports}`);
  console.log(`  tokOut: ${tokOut} (${(Number(tokOut)/1e12).toFixed(6)}B)`);
  console.log(`  minOut: ${minOut}`);

  const DISC_BUY = Uint8Array.from([0x66, 0x06, 0x3d, 0x12, 0x01, 0xda, 0xeb, 0xea]);

  function u64(n) {
    const b = new Uint8Array(8);
    new DataView(b.buffer).setBigUint64(0, n, true);
    return b;
  }

  const configPda = PublicKey.findProgramAddressSync([new TextEncoder().encode('config')], PROGRAM_ID)[0];
  const curvePda = PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), MINT.toBuffer()], PROGRAM_ID)[0];

  const curveAta = PublicKey.findProgramAddressSync(
    [curvePda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()],
    ATA_PROGRAM_ID
  )[0];

  const buyIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: curvePda, isSigner: false, isWritable: true },
      { pubkey: MINT, isSigner: false, isWritable: false },
      { pubkey: curveAta, isSigner: false, isWritable: true },
      { pubkey: traderAta, isSigner: false, isWritable: true },
      { pubkey: TRADER, isSigner: true, isWritable: true },
      { pubkey: FEE_WALLET, isSigner: false, isWritable: true },
      { pubkey: CREATOR_WALLET, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ATA_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(Uint8Array.from([...DISC_BUY, ...u64(lamports), ...u64(minOut)])),
  });

  const tx = new Transaction();
  tx.add(ComputeBudgetProgram.requestHeapFrame({ bytes: 256 * 1024 }));
  tx.add(buyIx);
  tx.feePayer = TRADER;

  const { blockhash: bh2 } = await connection.getLatestBlockhash();
  tx.recentBlockhash = bh2;
  tx.sign(kp);

  console.log('Sending buy...');
  try {
    const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
    console.log('BUY SIG:', sig);
    console.log('BUY CONFIRMED!');
    console.log('Explorer: https://explorer.solana.com/tx/' + sig + '?cluster=devnet');
    fs.writeFileSync('/tmp/smoke-buy-sig.txt', sig);
  } catch (e) {
    console.log('BUY FAILED:', e.message);
    console.log('Logs:', (e.transactionLogs || []).join('\n'));
  }
} else {
  console.log('\nCannot do buy — ATA does not exist');
}
