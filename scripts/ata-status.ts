import { execFile } from 'node:child_process';
import { PublicKey, Connection } from '@solana/web3.js';

const SMOKE_MINT = 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f';
const FEE_WALLET = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const ATA_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

const mint = new PublicKey(SMOKE_MINT);
const owner = new PublicKey(FEE_WALLET);
const ataProgram = new PublicKey(ATA_PROGRAM);
const tokenProgram = new PublicKey(TOKEN_PROGRAM);

// Canonical ATA derivation
const ata = PublicKey.findProgramAddressSync(
  [owner.toBuffer(), tokenProgram.toBuffer(), mint.toBuffer()],
  ataProgram
)[0];

console.log('Expected ATA:', ata.toString());

// Check on-chain via Solana devnet RPC
const RPC = 'https://api.devnet.solana.com';

async function checkAta() {
  try {
    const res = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountInfo',
        params: [ata.toString(), { encoding: 'base64' }]
      })
    });
    const json = await res.json();
    if (json.result && json.result.value) {
      console.log('✅ ATA exists on-chain:', ata.toString());
      return true;
    } else {
      console.log('❌ ATA does NOT exist on-chain:', ata.toString());
      return false;
    }
  } catch (e) {
    console.error('RPC error:', e.message);
    return false;
  }
}

async function main() {
  const exists = await checkAta();
  if (exists) {
    console.log('\nProceeding with buy/sell — ATA ready.');
  } else {
    console.log('\nCreating ATA via spl-token CLI...');
    // Use execFile for safety (no shell interpolation)
    execFile('spl-token', [
      'create-account', SMOKE_MINT,
      '-C', '/Users/cmd/.config/solana/cli/config.yml',
      '--fee-payer', '/Users/cmd/.config/solana/id.json'
    ], { timeout: 30000 }, (err, stdout, stderr) => {
      if (err) {
        if (err.message.includes('Account already exists')) {
          console.log('ATA already exists (CLI confirm).');
          process.exit(0);
        }
        console.error('ATA creation failed:', err.message);
        process.exit(1);
      }
      console.log('ATA created:', stdout.trim());
    });
  }
}

main();
