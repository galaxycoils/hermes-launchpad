import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const TRADER_B58 = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const MINT_B58 = 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f';
const ON_CHAIN_ATA = '59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud';

const TRADER = new PublicKey(TRADER_B58);
const MINT = new PublicKey(MINT_B58);

console.log('spl-token TOKEN_PROGRAM_ID:', TOKEN_PROGRAM_ID.toBase58());
console.log('Hermes     TOKEN_PROGRAM_ID: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5 (from solana.ts:9)');
console.log('');

// spl-token's canonical derivation
const canonicalAta = getAssociatedTokenAddressSync(MINT, TRADER);
console.log('spl-token getAssociatedTokenAddressSync:', canonicalAta.toBase58());
console.log('On-chain spl-token ATA:                  ', ON_CHAIN_ATA);
console.log('Match:', canonicalAta.toBase58() === ON_CHAIN_ATA ? 'YES ✓' : 'NO ✗');
console.log('');

// Check on-chain existence
const conn = new Connection('https://devnet.rpcpool.com', 'confirmed');
(async () => {
  try {
    const info = await conn.getAccountInfo(canonicalAta);
    console.log('Canonical ATA on-chain:', info ? 'EXISTS (lamports=' + info.lamports + ')' : 'MISSING');
  } catch (e) {
    console.log('Canonical ATA on-chain: ERROR', e.message || e);
  }
  try {
    const info = await conn.getAccountInfo(new PublicKey(ON_CHAIN_ATA));
    console.log('Known ATA on-chain:     ', info ? 'EXISTS (lamports=' + info.lamports + ')' : 'MISSING');
  } catch (e) {
    console.log('Known ATA on-chain:     ', 'ERROR', e.message || e);
  }
})();
