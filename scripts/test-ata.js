import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA');
const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

const MINT = new PublicKey('CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f');
const KP_PATH = '/Users/cmd/.config/solana/id.json';
const kpData = JSON.parse(fs.readFileSync(KP_PATH));
const kp = Keypair.fromSecretKey(new Uint8Array(kpData));
const TRADER = kp.publicKey;

const connection = new Connection('https://devnet.rpcpool.com', 'confirmed');

// Compute ATA using the same seed derivation
const traderAta = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()],
  ATA_PROGRAM_ID
)[0];

console.log('TRADER:', TRADER.toBase58());
console.log('MINT:', MINT.toBase58());
console.log('ATA:', traderAta.toBase58());

// Check if ATA exists
const existing = await connection.getAccountInfo(traderAta);
console.log('ATA exists:', !!existing);

if (existing) {
  console.log('Skipping ATA creation');
} else {
  // Build ATA instruction with proper key types
  // The instruction requires: payer=signer+writable, owner=non-signer, mint=non-signer
  // SystemProgram handled by the ATA program internally
  
  const ataIx = new TransactionInstruction({
    keys: [
      { pubkey: TRADER,        isSigner: true,  isWritable: true  },  // payer
      { pubkey: traderAta,     isSigner: false, isWritable: true  },  // new ATA
      { pubkey: TRADER,        isSigner: false, isWritable: false },  // owner
      { pubkey: MINT,          isSigner: false, isWritable: false },  // mint
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // SystemProgram
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },        // Token program
    ],
    programId: ATA_PROGRAM_ID,
    data: Buffer.alloc(0),
  });
  
  const tx = new Transaction();
  tx.add(ataIx);
  tx.feePayer = TRADER;
  
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.sign(kp);
  
  console.log('Sending ATA creation...');
  try {
    const sig = await connection.sendRawTransaction(tx.serialize(), { 
      skipPreflight: false, 
      preflightCommitment: 'confirmed' 
    });
    console.log('SIG:', sig);
    await connection.confirmTransaction(sig, 'confirmed');
    console.log('CONFIRMED!');
    
    const verify = await connection.getAccountInfo(traderAta);
    console.log('Now exists:', !!verify);
  } catch (e) {
    console.log('FAILED:', e.message);
  }
}
