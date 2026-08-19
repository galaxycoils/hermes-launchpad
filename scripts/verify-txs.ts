import { Connection, PublicKey } from '@solana/web3.js';

const conn = new Connection('https://devnet.rpcpool.com', 'confirmed');

const txs = [
  'XLBNHFCyMPUQ4zqJ8tiL5DTdnbBeaWQ97GaLjiwhQMuRcYC2Xhj4itRhE85W8hhZjdR5t3oPRQXW88ZUDRKq98s',
  '39MykuF1uVs9ksZYoYd9jdWFo6HHqrVV9gS1d3LkZevcbVvM3vpBUb7KV5V378yZANsTExT4cUuBBA7NLCrQ5YfR',
  'VwRP8JAxEFyBCodmbDwCWhjkVa4KfTxHH7HGtPPusGJE1fmAjnXEMUTDLa1G1zpchz4C3tnfe2NTKSANz1rLiGQ',
];

async function main() {
  for (const sig of txs) {
    console.log(`\n=== ${sig.slice(0,16)}... ===`);
    try {
      const info = await conn.getTransaction(sig);
      if (info) {
        console.log('Status:', info.meta?.err ? 'FAILED: ' + info.meta.err : 'CONFIRMED');
        console.log('Block time:', new Date(info.blockTime * 1000).toISOString());
        console.log('Signature:', sig);
      } else {
        console.log('NOT FOUND on devnet');
      }
    } catch (e) {
      console.log('ERROR:', e.message);
    }
  }
}
main();
