import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { sendAndConfirmTransaction, Transaction, TransactionInstruction, ComputeBudgetProgram } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

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

// Hermes findAta (WRONG ordering — owner, TOKEN_PROGRAM_ID, mint)
// This is what buildTradeIx trades against
const [hermesAta] = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()],
  ATA_PROGRAM_ID
);
const HERMES_ATA_B58 = hermesAta.toBase58();

// Correct canonical ordering (owner, mint, TOKEN_PROGRAM_ID)
const [canonicalAta] = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
  ATA_PROGRAM_ID
);
const CANONICAL_ATA_B58 = canonicalAta.toBase58();

console.log('=== ATA Identity Confirmation ===\n');
console.log('Hermes findAta  (owner, TOKEN, mint):', HERMES_ATA_B58);
console.log('Canonical        (owner, mint, TOKEN):', CANONICAL_ATA_B58);
console.log('Trader wallet (buildTradeIx expects) :', TRADER_B58);
console.log('');
console.log('Hermes ATA == trader wallet?', HERMES_ATA_B58 === TRADER_B58 ? 'YES — trade uses trader wallet as ATA' : 'NO');
console.log('Canonical ATA == trader wallet?', CANONICAL_ATA_B58 === TRADER_B58 ? 'YES' : 'NO');
console.log('');

// Check on-chain existence
async function checkAccounts() {
  console.log('=== On-chain account existence ===');
  const addresses = [
    ['trader wallet (Hermes trade expects)', TRADER_B58],
    ['hermes ATA (computed by findAta)', HERMES_ATA_B58],
    ['canonical ATA (correct ordering)', CANONICAL_ATA_B58],
  ];
  for (const [label, addr] of addresses) {
    try {
      const info = await connection.getAccountInfo(new PublicKey(addr));
      if (info) {
        const hasToken = info.data.length > 0;
        console.log(`  ${label} (${addr}): EXISTS — lamports=${info.lamports}, token-account=${hasToken}`);
      } else {
        console.log(`  ${label} (${addr}): MISSING`);
      }
    } catch (e) {
      console.log(`  ${label} (${addr}): ERROR ${e.message || e}`);
    }
  }
}

async function main() {
  await checkAccounts();

  console.log('\n=== Verdict ===');
  if (HERMES_ATA_B58 === TRADER_B58) {
    console.log('HERMES BUG CONFIRMED: findAta in src/lib/solana.ts uses [owner, TOKEN_PROGRAM_ID, mint]');
    console.log('but the ATA program canonical seed ordering is [owner, mint, TOKEN_PROGRAM_ID].');
    console.log('This makes findAta return the TRADER WALLET address itself (not a real ATA).');
    console.log('The buy instruction in buildTradeIx passes the trader wallet as both trader AND traderAta —');
    console.log('which is wrong. The instruction needs a real ATA address for the token account.');
    console.log('');
    console.log('FIX REQUIRED: Reorder findAta seeds to [owner, mint, TOKEN_PROGRAM_ID] (canonical order).');
    console.log('This changes traderAta from', TRADER_B58, '→', CANONICAL_ATA_B58);
    console.log('');
    console.log('Before fixing, need to create the canonical ATA on-chain:');
    console.log('  spl-token create-account', CONFIG.MINT, '--owner', CONFIG.TRADER, '--fee-payer', CONFIG.KEYPAIR);
  } else {
    console.log('ATA looks correct. Proceeding with trade...');
  }
}

main().catch(console.error);
