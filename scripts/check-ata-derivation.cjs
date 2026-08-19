const { PublicKey } = require('@solana/web3.js');

const SMOKE_MINT = 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f';
const OWNER = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ATA_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

const mint = new PublicKey(SMOKE_MINT);
const owner = new PublicKey(OWNER);
const tokenProgram = new PublicKey(TOKEN_PROGRAM);
const ataProgram = new PublicKey(ATA_PROGRAM);

console.log('--- Seed order variants ---');
console.log('');

// Variant A: [owner, tokenProgram, mint]  ← current code
const a = PublicKey.findProgramAddressSync(
  [owner.toBuffer(), tokenProgram.toBuffer(), mint.toBuffer()],
  ataProgram
)[0];
console.log('A) [owner, TOKEN_PROGRAM, mint]:', a.toString());

// Variant B: [owner, mint, tokenProgram]
const b = PublicKey.findProgramAddressSync(
  [owner.toBuffer(), mint.toBuffer(), tokenProgram.toBuffer()],
  ataProgram
)[0];
console.log('B) [owner, mint, TOKEN_PROGRAM]:', b.toString());

// Variant C: [mint, owner, tokenProgram]
const c = PublicKey.findProgramAddressSync(
  [mint.toBuffer(), owner.toBuffer(), tokenProgram.toBuffer()],
  ataProgram
)[0];
console.log('C) [mint, owner, TOKEN_PROGRAM]:', c.toString());

console.log('');
console.log('Known on-chain addresses:');
console.log('  spl-token creates:  59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud');
console.log('  Session claims Hermes expects: 8e24Szb7NqbqcymkzoYpATYxZsiK14z8jPXhYFwaUfDp');
