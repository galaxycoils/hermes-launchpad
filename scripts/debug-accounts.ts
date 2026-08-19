#!/usr/bin/env npx tsx
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';

const conn = new Connection('https://devnet.rpcpool.com', 'confirmed');
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('/Users/cmd/.config/solana/id.json', 'utf8'))));

console.log('Keypair pubkey:', kp.publicKey.toBase58());

const CHECK = [
  ['Trader (GkHE2vb8j...)', 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a'],
  ['Fee wallet (9Sv1k...)', '9Sv1kApQK428EUueU7dR9mTPqKqNR7dxkBmwtZuHDTkr'],
  ['ATA (59tgQcjN...)', '59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud'],
];

for (const [label, addr] of CHECK) {
  const info = await conn.getAccountInfo(new PublicKey(addr));
  if (info) {
    console.log(label + ':', addr, '— lamports:', info.lamports, 'dataLen:', info.data.length);
  } else {
    console.log(label + ':', addr, '— NOT FOUND');
  }
}

// Check if trader has SMOKE tokens
const TRADER_ATA = new PublicKey('59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud');
const ataInfo = await conn.getAccountInfo(TRADER_ATA);
if (ataInfo) {
  console.log('\nATA data (first 32 bytes):', Buffer.from(ataInfo.data.slice(0, 32)).toString('hex'));
  console.log('ATA data length:', ataInfo.data.length);
  // SPL token account data: 8 (owner len) + owner + 8 (mint len) + mint + 8 (balance) + 8 (delegate) + ...
  // Actually: 112 bytes total: 8(owner len) + owner(32) + 8(mint len) + mint(32) + 8(balance) + 8(delegate len) + delegate(32)
  // Let's just read the balance from the account data
}

// Try reading token balance via RPC
const balResult = await conn.getTokenAccountBalance(TRADER_ATA);
console.log('\nToken balance from RPC:', balResult.value);
