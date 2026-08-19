import { Connection, PublicKey } from '@solana/web3.js';

const MINT = 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f';
const TRADER = '8e24Szb7NqbqcymkzoYpATYxZsiK14z8jPXhYFwaUfDp';
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA';
const ATA_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

const mint = new PublicKey(MINT);
const trader = new PublicKey(TRADER);
const tokProg = new PublicKey(TOKEN_PROGRAM_ID);
const ataProg = new PublicKey(ATA_PROGRAM_ID);

// Current Hermes ordering (WRONG)
const [hermesAta] = PublicKey.findProgramAddressSync(
  [trader.toBuffer(), tokProg.toBuffer(), mint.toBuffer()],
  ataProg
);

// Correct canonical ordering
const [canonicalAta] = PublicKey.findProgramAddressSync(
  [trader.toBuffer(), mint.toBuffer(), tokProg.toBuffer()],
  ataProg
);

console.log('Hermes findAta  (owner, TOKEN, mint):', hermesAta.toBase58());
console.log('Canonical ATA   (owner, mint, TOKEN):', canonicalAta.toBase58());
console.log('Trader wallet:', TRADER);
console.log('');
console.log('Hermes ATA == trader?', hermesAta.toBase58() === TRADER ? 'YES — bug confirmed' : 'NO');
console.log('Canonical ATA == Hermes?',
  canonicalAta.toBase58() === hermesAta.toBase58() ? 'YES' : 'NO (bug: different addresses)');
console.log('');
console.log('To fix: change findAta in src/lib/solana.ts to use [owner, mint, TOKEN_PROGRAM_ID]');
console.log('Then trade instruction will use canonical ATA address:', canonicalAta.toBase58());
