#!/usr/bin/env node
// Create canonical ATA for GkHE2vb8j... (fee wallet = trader) on SMOKE.
// Uses spl-token CLI for reliable ATA creation.

const { execFileSync } = require('child_process');

const MINT = 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f';
const FEE_WALLET = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const CLI_CONFIG = '/Users/cmd/.config/solana/cli/config.yml';
const FEE_PAYER = '/Users/cmd/.config/solana/id.json';

console.log('Creating SMOKE ATA for', FEE_WALLET);
console.log('CLI config:', CLI_CONFIG);
console.log('Fee payer :', FEE_PAYER);
console.log('');

try {
  // execFileSync with static arg array — no shell injection (all args are hardcoded constants)
  const output = execFileSync('spl-token', [
    'create-account', MINT,
    '-C', CLI_CONFIG,
    '--fee-payer', FEE_PAYER,
  ], { encoding: 'utf8', timeout: 30000 });
  console.log('CLI output:');
  console.log(output);

  const match = output.match(/Creating account\s+(\S+)/);
  if (match) {
    const ataAddress = match[1];
    console.log('\n=== ATA CREATED ===');
    console.log('ATA address:', ataAddress);
    console.log('Wallet     :', FEE_WALLET);
    console.log('Mint       :', MINT);
    console.log('\nNext: run smoke-buy-final.ts to buy 0.02 SOL SMOKE');
  } else {
    console.log('Could not parse ATA from output. Check manually.');
    process.exit(1);
  }
} catch (e) {
  const msg = (e.error && e.error.message) || (e.message || '');
  if (msg.includes('Account already exists')) {
    const match = msg.match(/Account already exists:\s+(\S+)/);
    if (match) {
      console.log('\nATA already exists at:', match[1]);
      console.log('Next: run smoke-buy-final.ts to buy 0.02 SOL SMOKE');
    } else {
      console.log('ATA already exists — check spl-token accounts');
      console.log('Next: run smoke-buy-final.ts to buy 0.02 SOL SMOKE');
    }
  } else {
    console.error('ATA creation FAILED:', msg);
    process.exit(1);
  }
}
