#!/usr/bin/env npx tsx
import { Connection, PublicKey } from '@solana/web3.js';

const conn = new Connection('https://devnet.rpcpool.com', 'confirmed');
const TOKEN_Rs = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA');
const TOKEN_Ss = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

async function main() {
  const [r, s] = await Promise.all([conn.getAccountInfo(TOKEN_Rs), conn.getAccountInfo(TOKEN_Ss)]);
  console.log('TOKEN f9Rs623:', r ? 'EXISTS on-chain' : 'MISSING');
  console.log('TOKEN f9Ss623:', s ? 'EXISTS on-chain' : 'MISSING');
  if (r) console.log('  Owner:', r.owner.toBase58());
  if (s) console.log('  Owner:', s.owner.toBase58());
}

main();
