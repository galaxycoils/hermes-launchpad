#!/usr/bin/env npx tsx
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction, ComputeBudgetProgram, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import fs from 'fs';

const connection = new Connection('https://devnet.rpcpool.com', 'confirmed');
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('/Users/cmd/.config/solana/id.json', 'utf8'))));

const FEE_WALLET = kp.publicKey;
const MINT = new PublicKey('CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA');
const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// Compute canonical ATA for fee wallet using canonical seed ordering
const [feeAta] = PublicKey.findProgramAddressSync(
  [FEE_WALLET.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
);

console.log('Fee wallet (keypair):', FEE_WALLET.toBase58());
console.log('Canonical ATA       :', feeAta.toBase58());

// Check fee wallet SOL balance
const info = await connection.getAccountInfo(FEE_WALLET);
console.log('Fee wallet SOL:', (info?.lamports ?? 0) / LAMPORTS_PER_SOL);

// Check if ATA exists on-chain
const ataInfo = await connection.getAccountInfo(feeAta);
console.log('ATA exists:', ataInfo ? 'YES (lamports=' + ataInfo.lamports + ')' : 'NO');

// Try creating ATA if missing
if (!ataInfo) {
  console.log('\nCreating ATA with createAssociatedTokenAccountInstruction...');
  const ix = createAssociatedTokenAccountInstruction(
    FEE_WALLET, feeAta, FEE_WALLET, MINT, TOKEN_PROGRAM_ID, ATA_PROGRAM_ID,
  );
  console.log('Instruction keys:');
  for (const k of ix.keys) {
    console.log('  ' + (k.isSigner ? '[SIGNER] ' : '[NON-SIGNER] ') + (k.isWritable ? 'WRITABLE ' : 'READ-ONLY ') + k.pubkey.toBase58());
  }
  const tx = new Transaction().add(ix);
  tx.feePayer = FEE_WALLET;
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.sign(kp);
  try {
    const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
    console.log('\nATA created:', sig);
    console.log('Explorer: https://explorer.solana.com/tx/' + sig + '?cluster=devnet');
  } catch (e: any) {
    console.log('\nFAILED:', e.message);
    console.log('Logs:', e.transactionLogs?.join('\n') || '');
  }
}
