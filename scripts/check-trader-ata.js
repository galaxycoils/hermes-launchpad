import { Connection, PublicKey } from '@solana/web3.js';

const mint = 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f';
const trader = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const TOKEN = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Rs623VQ5DA';
const ATA_PROG = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

const connection = new Connection('https://devnet.rpcpool.com', 'confirmed');

(async () => {
  const mintPub = new PublicKey(mint);
  const traderPub = new PublicKey(trader);
  const TOKENPub = new PublicKey(TOKEN);
  const ATAPub = new PublicKey(ATA_PROG);

  // What buildTradeIx currently computes (hermes findAta ordering: owner, TOKEN, mint)
  const [hermesTraderAta] = PublicKey.findProgramAddressSync(
    [traderPub.toBuffer(), TOKENPub.toBuffer(), mintPub.toBuffer()],
    ATAPub
  );

  // Correct canonical ordering: owner, mint, TOKEN
  const [canonicalTraderAta] = PublicKey.findProgramAddressSync(
    [traderPub.toBuffer(), mintPub.toBuffer(), TOKENPub.toBuffer()],
    ATAPub
  );

  console.log('buildTradeIx computes (owner, TOKEN, mint):', hermesTraderAta.toBase58());
  console.log('Canonical (owner, mint, TOKEN):', canonicalTraderAta.toBase58());

  // Check both on-chain
  let hInfo, cInfo;
  try { hInfo = await connection.getAccountInfo(hermesTraderAta); } catch(e) {}
  try { cInfo = await connection.getAccountInfo(canonicalTraderAta); } catch(e) {}

  console.log('Hermes trader ATA on-chain:', hInfo ? 'EXISTS (lamports=' + hInfo.lamports + ')' : 'MISSING');
  console.log('Canonical trader ATA on-chain:', cInfo ? 'EXISTS (lamports=' + cInfo.lamports + ')' : 'MISSING');
})().catch(console.error);
