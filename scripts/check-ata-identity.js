import { Connection, PublicKey } from '@solana/web3.js';

const mint = 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f';
const ownerFirst = '8e24Szb7NqbqcymkzoYpATYxZsiK14z8jPXhYFwaUfDp';
const splTokenAta = '59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud';

const connection = new Connection('https://devnet.rpcpool.com', 'confirmed');

async function main() {
  console.log('=== ATA address identity check ===\n');

  const mintPub = new PublicKey(mint);
  const ownerFirstPub = new PublicKey(ownerFirst);

  // Hermes ordering: [owner, TOKEN_PROGRAM_ID, mint]
  const [hermesAtaPub] = PublicKey.findProgramAddressSync(
    [ownerFirstPub.toBuffer(),
     new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA').toBuffer(),
     mintPub.toBuffer()],
    new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
  );

  // Correct canonical: [owner, mint, TOKEN_PROGRAM_ID]
  const [canonicalAtaPub] = PublicKey.findProgramAddressSync(
    [ownerFirstPub.toBuffer(),
     mintPub.toBuffer(),
     new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA').toBuffer()],
    new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
  );

  const hermesB58 = hermesAtaPub.toBase58();
  const canonicalB58 = canonicalAtaPub.toBase58();

  console.log('Hermes findAta  (owner, TOKEN, mint):', hermesB58);
  console.log('Canonical        (owner, mint, TOKEN):', canonicalB58);
  console.log('Known spl-token  on-chain ATA         :', splTokenAta);
  console.log('Hermes trade expects                   :', ownerFirst);
  console.log('');

  const matchHermes = hermesB58 === ownerFirst ? 'MATCH ✓' : 'MISMATCH ✗';
  const matchCanonical = canonicalB58 === ownerFirst ? 'MATCH ✓' : 'MISMATCH ✗';
  const matchSplToken = splTokenAta === ownerFirst ? 'MATCH ✓' : 'MISMATCH ✗';

  console.log('Hermes findAta  == owner-first address?', matchHermes, `(hermes=${hermesB58}, owner=${ownerFirst})`);
  console.log('Canonical        == owner-first address?', matchCanonical, `(canonical=${canonicalB58}, owner=${ownerFirst})`);
  console.log('spl-token        == owner-first address?', matchSplToken, `(spl=${splTokenAta}, owner=${ownerFirst})`);
  console.log('');

  console.log('=== On-chain account existence ===');
  for (const [label, addr] of [
    ['owner-first (Hermes expects)', ownerFirst],
    ['spl-token ATA (exists on-chain)', splTokenAta],
    ['canonical ATA', canonicalB58],
  ]) {
    try {
      const info = await connection.getAccountInfo(new PublicKey(addr));
      console.log(`${label} (${addr}): ${info ? 'EXISTS (lamports=' + info.lamports + ')' : 'MISSING'}`);
    } catch (e) {
      console.log(`${label} (${addr}): ERROR ${e.message || e}`);
    }
  }
}

main().catch(console.error);
