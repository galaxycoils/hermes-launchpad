import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, getMint } from '@solana/spl-token';
import fs from 'fs';

(async () => {
  const CONNECTION = new Connection('https://devnet.rpcpool.com', 'confirmed');
  const MINT = new PublicKey('CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f');
  const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  const ATA_PROGRAM = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
  const KP_PATH = '/Users/cmd/.config/solana/id.json';
  const kp = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(KP_PATH))));
  const TRADER = kp.publicKey;

  console.log('=== ATA DERIVATION DIAGNOSTIC ===');
  console.log('Trader:', TRADER.toBase58());
  console.log('Mint:', MINT.toBase58());
  console.log('');

  const hermTheseed = PublicKey.findProgramAddressSync(
    [TRADER.toBuffer(), TOKEN_PROGRAM.toBuffer(), MINT.toBuffer()],
    ATA_PROGRAM
  )[0];
  console.log('Order [owner, TOKEN_PROGRAM, mint]:', hermTheseed.toBase58());

  const hermWrongSeed = PublicKey.findProgramAddressSync(
    [TRADER.toBuffer(), MINT.toBuffer(), TOKEN_PROGRAM.toBuffer()],
    ATA_PROGRAM
  )[0];
  console.log('Order [owner, mint, TOKEN_PROGRAM]:', hermWrongSeed.toBase58());

  const splTokenAta = getAssociatedTokenAddressSync(MINT, TRADER, false, TOKEN_PROGRAM, ATA_PROGRAM);
  console.log('spl-token getAssociatedTokenAddressSync:', splTokenAta.toBase58());

  const candidates = {
    '[owner, TOKEN_PROGRAM, mint] (solana.ts current)': hermTheseed,
    '[owner, mint, TOKEN_PROGRAM] (Hermes claimed)': hermWrongSeed,
    'spl-token getAssociatedTokenAddressSync': splTokenAta,
  };

  for (const [label, addr] of Object.entries(candidates)) {
    const info = await CONNECTION.getAccountInfo(addr);
    const exists = !!info;
    console.log(`\n${label}`);
    console.log('  address:', addr.toBase58());
    console.log('  exists:', exists);
    if (exists) {
      console.log('  lamports:', info.lamports);
      console.log('  owner:', info.owner.toBase58());
      console.log('  data len:', info.data.length);
      console.log('  is ATA:', info.owner.equals(ATA_PROGRAM) ? 'YES' : 'NO');
    }
  }

  try {
    const mintInfo = await getMint(CONNECTION, MINT);
    console.log('\nMint supply:', mintInfo.supply.toString());
    console.log('Mint decimals:', mintInfo.decimals);
    console.log('Mint token program:', mintInfo.tokenProgram.toBase58());
  } catch (e) {
    console.log('\nFailed to get mint:', e.message);
  }
})();
