import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID as ST_TOKEN } from '@solana/spl-token';

const mintB58 = 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f';
const ownerB58 = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const ATA_PROG_B58 = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

console.log('=== Constants comparison ===');
console.log('spl-token TOKEN_PROGRAM_ID:', ST_TOKEN.toBase58(), '(len=' + ST_TOKEN.toBase58().length + ')');
console.log('Hermes     TOKEN_PROGRAM_ID: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5 (len=44)');
console.log('');

const mintPub = new PublicKey(mintB58);
const ownerPub = new PublicKey(ownerB58);
const ataProgPub = new PublicKey(ATA_PROG_B58);

// Hermes-style: [owner, TOKEN_PROGRAM_ID (Hermes 44-char), mint]
const [hermesAta] = PublicKey.findProgramAddressSync(
  [ownerPub.toBuffer(), new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5').toBuffer(), mintPub.toBuffer()],
  ataProgPub
);
console.log('Hermes findAta (owner, 44-char-TOKEN, mint):', hermesAta.toBase58());

// spl-token canonical: [owner, ST_TOKEN (43-char), mint]
const [stAta] = PublicKey.findProgramAddressSync(
  [ownerPub.toBuffer(), ST_TOKEN.toBuffer(), mintPub.toBuffer()],
  ataProgPub
);
console.log('spl-token canonical (owner, 43-char-TOKEN, mint):', stAta.toBase58());

// What getAssociatedTokenAddressSync actually returns
const syncAta = getAssociatedTokenAddressSync(mintPub, ownerPub);
console.log('getAssociatedTokenAddressSync(mint, owner):', syncAta.toBase58());

console.log('');
console.log('On-chain ATA: 59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud');
console.log('');
console.log('Match on-chain:');
console.log('  Hermes    :', hermesAta.toBase58() === '59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud' ? 'YES' : 'NO');
console.log('  spl-token :', stAta.toBase58() === '59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud' ? 'YES' : 'NO');
console.log('  getAssoc  :', syncAta.toBase58() === '59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud' ? 'YES' : 'NO');
