import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';

const kpData = JSON.parse(fs.readFileSync('/Users/cmd/.config/solana/id.json'));
const kp = Keypair.fromSecretKey(new Uint8Array(kpData));
const conn = new Connection('https://devnet.rpcpool.com', 'confirmed');

const TRADER = new PublicKey('GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a');
const MINT = new PublicKey('CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f');
const TOKEN = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA');

const ATA_PROGRAM = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

console.log('=== ATA derivation comparison ===\n');

// Order 1: [owner, TOKEN, mint] — what Hermes findAta uses (WRONG per session summary)
const [ata1] = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), TOKEN.toBuffer(), MINT.toBuffer()],
  ATA_PROGRAM
);
console.log('1. [owner, TOKEN_PROGRAM, mint]:', ata1.toBase58());

// Order 2: [owner, mint, TOKEN] — what buildTradeIx expects (WRONG per session summary)
const [ata2] = PublicKey.findProgramAddressSync(
  [TRADER.toBuffer(), MINT.toBuffer(), TOKEN.toBuffer()],
  ATA_PROGRAM
);
console.log('2. [owner, mint, TOKEN_PROGRAM]:', ata2.toBase58());

console.log('\nOn-chain ATA (from spl-token): 59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud');
console.log('');

// Check which one exists on-chain
const check = async (label, addr) => {
  try {
    const info = await conn.getAccountInfo(addr);
    const owner = info ? await conn.getAccountOwner(addr) : null;
    return `${label}: ${info ? 'EXISTS (lamports=' + info.lamports + ', owner=' + (owner ? owner.toBase58() : 'null') + ')' : 'MISSING'}`;
  } catch (e) {
    return `${label}: ERROR ${e.message || e}`;
  }
};

(async () => {
  console.log(await check('ATA1', ata1));
  console.log(await check('ATA2', ata2));
  console.log(await check('Known spl-token ATA', new PublicKey('59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud')));
})().catch(console.error);
