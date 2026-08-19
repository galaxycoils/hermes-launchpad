#!/usr/bin/env npx tsx
// Verify ATA identity and run SMOKE buy on devnet.
// Uses canonical [owner, mint, TOKEN_PROGRAM_ID] ATA address.

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction, ComputeBudgetProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import fs from 'fs';

const CONFIG = {
  RPC: 'https://devnet.rpcpool.com',
  PROGRAM_ID: '9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz',
  TOKEN_PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA',
  ATA_PROGRAM_ID: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  MINT: 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f',
  TRADER: '8e24Szb7NqbqcymkzoYpATYxZsiK14z8jPXhYFwaUfDp',
  FEE_WALLET: '9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr',
  CREATOR_WALLET: '9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr',
  KEYPAIR: '/Users/cmd/.config/solana/id.json',
  SMOKE_AMOUNT_SOL: 0.02,
};

const PROGRAM_ID = new PublicKey(CONFIG.PROGRAM_ID);
const TOKEN_PROGRAM_ID = new PublicKey(CONFIG.TOKEN_PROGRAM_ID);
const ATA_PROGRAM_ID = new PublicKey(CONFIG.ATA_PROGRAM_ID);
const MINT = new PublicKey(CONFIG.MINT);
const TRADER = new PublicKey(CONFIG.TRADER);
const FEE_WALLET = new PublicKey(CONFIG.FEE_WALLET);
const CREATOR_WALLET = new PublicKey(CONFIG.CREATOR_WALLET);

const connection = new Connection(CONFIG.RPC, 'confirmed');
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(CONFIG.KEYPAIR, 'utf8'))));
const TRADER_B58 = TRADER.toBase58();

// Hermes ordering (WRONG): [owner, TOKEN_PROGRAM_ID, mint]
const [hermesAta] = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()],
  ATA_PROGRAM_ID
);
const HERMES_ATA_B58 = hermesAta.toBase58();

// Correct canonical ordering: [owner, mint, TOKEN_PROGRAM_ID]
const [canonicalAta] = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
);
const CANONICAL_ATA_B58 = canonicalAta.toBase58();

console.log('=== ATA Identity Check ===');
console.log('Hermes findAta  (owner, TOKEN, mint):', HERMES_ATA_B58);
console.log('Canonical        (owner, mint, TOKEN):', CANONICAL_ATA_B58);
console.log('Trader wallet                          :', TRADER_B58);
console.log('');

const HERMES_MATCHES_TRADER = HERMES_ATA_B58 === TRADER_B58;
const CANONICAL_MATCHES_TRADER = CANONICAL_ATA_B58 === TRADER_B58;

console.log('Hermes ATA == trader wallet?', HERMES_MATCHES_TRADER ? 'YES — findAta returns trader wallet itself' : 'NO');
console.log('Canonical ATA == trader wallet?', CANONICAL_MATCHES_TRADER ? 'YES' : 'NO');
console.log('');

// Check on-chain existence
console.log('=== On-chain account existence ===');
const checkLabels = [
  ['trader wallet (Hermes trade expects)', TRADER_B58],
  ['hermes ATA (computed by buggy findAta)', HERMES_ATA_B58],
  ['canonical ATA (correct ordering)', CANONICAL_ATA_B58],
];
for (const [label, addr] of checkLabels) {
  try {
    const info = await connection.getAccountInfo(new PublicKey(addr));
    if (info) {
      const hasTokenAccount = info.data.length > 0;
      console.log(`  ${label} (${addr}): EXISTS — lamports=${info.lamports}, token-data=${hasTokenAccount ? 'yes' : 'no'}`);
    } else {
      console.log(`  ${label} (${addr}): MISSING`);
    }
  } catch (e) {
    console.log(`  ${label} (${addr}): ERROR ${e.message || e}`);
  }
}
console.log('');

// VERDICT
console.log('=== VERDICT ===');
if (HERMES_MATCHES_TRADER) {
  console.log('HERMES BUG CONFIRMED in src/lib/solana.ts findAta():');
  console.log('  Uses [owner, TOKEN_PROGRAM_ID, mint] — WRONG canonical seed ordering.');
  console.log('  ATA program canonical ordering is [owner, mint, TOKEN_PROGRAM_ID].');
  console.log('  This makes findAta return the TRADER WALLET address itself.');
  console.log('');
  console.log('  buildTradeIx traderAta = findAta(mint, trader) = ' + HERMES_ATA_B58 + ' = TRADER');
  console.log('  So the instruction passes trader wallet as both trader AND traderAta.');
  console.log('');
  console.log('  FIX: Reorder findAta seeds to [owner, mint, TOKEN_PROGRAM_ID].');
  console.log('  Then traderAta becomes ' + CANONICAL_ATA_B58 + ' (a real ATA).');
  console.log('');
  console.log('  Before fixing src/lib/solana.ts, we can still do a manual trade using');
  console.log('  the canonical ATA address ' + CANONICAL_ATA_B58 + ' directly.');
} else {
  console.log('No bug detected. Proceed with trade.');
}
console.log('');

// Execute buy if we have enough SOL and canonical ATA exists (or can be created)
async function executeBuy() {
  const canonicalInfo = await connection.getAccountInfo(canonicalAta);
  if (!canonicalInfo) {
    console.log('Creating canonical ATA on-chain...');
    const rentLamports = await connection.getMinimumBalanceForRentExemption(165);
    const createAtaIx = createAssociatedTokenAccountInstruction(
      kp.publicKey,
      canonicalAta,
      TRADER,
      MINT,
      TOKEN_PROGRAM_ID,
    );
    const tx = new Transaction().add(createAtaIx);
    tx.feePayer = kp.publicKey;
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.sign(kp);
    await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
    console.log('Canonical ATA created on-chain!');
  } else {
    console.log('Canonical ATA already exists on-chain — skipping creation.');
  }

  const traderInfo = await connection.getAccountInfo(TRADER);
  const traderLamports = traderInfo ? traderInfo.lamports : 0;
  const needed = BigInt(Math.round(CONFIG.SMOKE_AMOUNT_SOL * LAMPORTS_PER_SOL)) + 2000000n;
  console.log(`Trader SOL: ${(traderLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  console.log(`Needed: ${(needed / LAMPORTS_PER_SOL).toFixed(4)} SOL (amount + fee buffer)`);

  if (traderLamports < needed) {
    console.log(`Insufficient SOL. Exit.`);
    process.exit(1);
  }

  const lamports = BigInt(Math.round(CONFIG.SMOKE_AMOUNT_SOL * LAMPORTS_PER_SOL));
  const minOut = lamports; // 1:1 approximate — SMOKE price unknown, just set minOut = lamports

  console.log(`\nBuying 0.02 SOL worth of SMOKE...`);
  console.log(`  SOL amount (lamports): ${lamports}`);
  console.log(`  minOut: ${minOut}`);

  const DISC_BUY = Uint8Array.from([0x66, 0x06, 0x3d, 0x12, 0x01, 0xda, 0xeb, 0xea]);

  function u64(n: bigint): Uint8Array {
    const b = new Uint8Array(8);
    new DataView(b.buffer).setBigUint64(0, n, true);
    return b;
  }

  const configPda = PublicKey.findProgramAddressSync([new TextEncoder().encode('config')], PROGRAM_ID)[0];
  const curvePda = PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), MINT.toBuffer()], PROGRAM_ID)[0];

  const buyIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: curvePda, isSigner: false, isWritable: true },
      { pubkey: MINT, isSigner: false, isWritable: false },
      { pubkey: canonicalAta, isSigner: false, isWritable: true },
      { pubkey: TRADER, isSigner: true, isWritable: true },
      { pubkey: FEE_WALLET, isSigner: false, isWritable: true },
      { pubkey: CREATOR_WALLET, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ATA_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: PublicKey.systemProgramId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(Uint8Array.from([...DISC_BUY, ...u64(lamports), ...u64(minOut)])),
  });

  const tx = new Transaction();
  tx.add(ComputeBudgetProgram.requestHeapFrame({ bytes: 256 * 1024 }));
  tx.add(buyIx);
  tx.feePayer = TRADER;

  const { blockhash: bh } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = bh;
  tx.sign(kp);

  console.log('\nSending buy transaction...');
  try {
    const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
    console.log('BUY SIG:', sig);
    console.log('BUY CONFIRMED!');
    console.log('Explorer: https://explorer.solana.com/tx/' + sig + '?cluster=devnet');
    fs.writeFileSync('/tmp/smoke-buy-sig.txt', sig);
  } catch (e: any) {
    console.log('BUY FAILED:', e.message);
    console.log('Logs:', (e.transactionLogs || []).join('\n'));
  }
}

executeBuy().catch((e) => { console.error(e); process.exit(1); });
