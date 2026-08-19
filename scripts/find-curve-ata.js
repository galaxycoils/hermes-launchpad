#!/usr/bin/env npx tsx
// Create curve ATA on devnet using manual instruction construction.
// The curve ATA is the token account for the curve PDA's mint position.

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token';
import fs from 'fs';

const CONFIG = {
  RPC: 'https://devnet.rpcpool.com',
  PROGRAM_ID: '9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz',
  TOKEN_PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA',
  ATA_PROGRAM_ID: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  MINT: 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f',
  TRADER: 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a',
  KEYPAIR: '/Users/cmd/.config/solana/id.json',
};

const connection = new Connection(CONFIG.RPC, 'confirmed');
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(CONFIG.KEYPAIR, 'utf8'))));

const PROGRAM_ID = new PublicKey(CONFIG.PROGRAM_ID);
const TOKEN_PROGRAM_ID = new PublicKey(CONFIG.TOKEN_PROGRAM_ID);
const ATA_PROGRAM_ID = new PublicKey(CONFIG.ATA_PROGRAM_ID);
const MINT = new PublicKey(CONFIG.MINT);
const TRADER = new PublicKey(CONFIG.TRADER);

// Compute curve PDA and curve ATA
const curvePda = PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), MINT.toBuffer()], PROGRAM_ID)[0];
console.log('Curve PDA:', curvePda.toBase58());

// The curve ATA — but whose ATA is it? It should be an ATA for the curve PDA's token.
// The curve PDA holds SOL and tokens. The curve ATA is where the curve's token balance lives.
// It's an ATA owned by... the curve PDA? No, ATAs can't be owned by PDAs.
// Let me check the program's init instruction to understand.

// Actually, in Hermes, the curve ATA is likely the ATA for the CURVE PDA as the "owner"
// but since PDAs can't own token accounts, this doesn't work.
// Alternative: the curve ATA is for the FEE_WALLET or CREATOR as owner, associated with the mint.

// Let me check what the initCreateToken instruction actually does with the curveAta.
// From the IDL comments and the buildCreateTokenIx function, the curveAta is passed as
// curve_token_account in the CreateToken instruction.

// The simplest interpretation: curveAta is the ATA where the curve's token shares live.
// It must be owned by someone who can sign for the curve. Since the curve PDA can't sign,
// it must be owned by the creator or fee wallet.

// Let's try: curve ATA = ATA for mint, owned by FEE_WALLET (creator)
const FEE_WALLET = new PublicKey('9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr');

const [feeWalletAta] = PublicKey.findProgramAddressSync(
  [FEE_WALLET.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
);
console.log('Fee wallet ATA for mint:', feeWalletAta.toBase58());

const [curveAtaAlt] = PublicKey.findProgramAddressSync(
  [curvePda.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
);
console.log('Curve PDA as owner ATA:', curveAtaAlt.toBase58());

// Check which one exists on-chain
const feeAtaInfo = await connection.getAccountInfo(feeWalletAta);
const curveAtaInfo = await connection.getAccountInfo(curveAtaAlt);

console.log('\nFee wallet ATA exists:', feeAtaInfo ? 'YES (lamports=' + feeAtaInfo.lamports + ')' : 'NO');
console.log('Curve PDA ATA exists:', curveAtaInfo ? 'YES (lamports=' + curveAtaInfo.lamports + ')' : 'NO');

// The curve ATA in the buy instruction was 7mJ1hjDMqzaiizwD9pQepiUt2eeHXbjRG5BMVXu4kiVA
// Let's see which computation produces that address
const targetAta = new PublicKey('7mJ1hjDMqzaiizwD9pQepiUt2eeHXbjRG5BMVXu4kiVA');

// Try different seed combinations to find what produces 7mJ1hjD...
const seedVariants = [
  ['curvePda, MINT, TOKEN', [curvePda.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()]],
  ['curvePda, TOKEN, MINT', [curvePda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()]],
  ['FEE_WALLET, MINT, TOKEN', [FEE_WALLET.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()]],
  ['MINT, curvePda, TOKEN', [MINT.toBuffer(), curvePda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()]],
  ['TRADER, MINT, TOKEN', [TRADER.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()]],
  ['TRADER, TOKEN, MINT', [TRADER.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()]],
];

for (const [label, seeds] of seedVariants) {
  const [ata] = PublicKey.findProgramAddressSync(seeds, ATA_PROGRAM_ID);
  const match = ata.equals(targetAta) ? ' ← MATCH!' : '';
  console.log(`${label}: ${ata.toBase58()}${match}`);
}
