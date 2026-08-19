import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

const ownerPub = new PublicKey('GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a');
const mintPub = new PublicKey('CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f');

const ata = getAssociatedTokenAddressSync(mintPub, ownerPub);
console.log('spl-token canonical ATA:', ata.toBase58());
console.log('Known on-chain ATA:     59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud');
console.log('Match:', ata.toBase58() === '59tgQcjNUfyEFigmgUzJhR2JWc1P68yEu7xRPMNk5Dud' ? 'YES ✓' : 'NO ✗');
