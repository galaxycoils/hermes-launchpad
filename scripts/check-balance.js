import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';

const kpData = JSON.parse(fs.readFileSync('/Users/cmd/.config/solana/id.json'));
const kp = Keypair.fromSecretKey(new Uint8Array(kpData));
const conn = new Connection('https://devnet.rpcpool.com', 'confirmed');

(async () => {
  console.log('Keypair derived pubkey:', kp.publicKey.toBase58());
  console.log('Config TRADER:', 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a');
  console.log('Match:', kp.publicKey.toBase58() === 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a' ? 'YES' : 'NO');
  const info = await conn.getAccountInfo(kp.publicKey);
  console.log('SOL balance:', (info.lamports / LAMPORTS_PER_SOL).toFixed(4), 'SOL');
  console.log('Needed for 0.02 SMOKE buy + fees:', (0.02 + 0.005).toFixed(4), 'SOL (approx)');
})().catch(console.error);
