import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction, ComputeBudgetProgram, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';
import fs from 'fs';

const PROGRAM_ID = new PublicKey('9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const MINT = new PublicKey('CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f');
const FEE_WALLET = new PublicKey('GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a');
const CREATOR_WALLET = FEE_WALLET;
const KP_PATH = '/Users/cmd/.config/solana/id.json';
const kp = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(KP_PATH))));
const TRADER = kp.publicKey;
const connection = new Connection('https://devnet.rpcpool.com', 'confirmed');

const configPda = PublicKey.findProgramAddressSync([new TextEncoder().encode('config')], PROGRAM_ID)[0];
const curvePda = PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), MINT.toBuffer()], PROGRAM_ID)[0];
const traderAta = PublicKey.findProgramAddressSync([TRADER.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()], ATA_PROGRAM_ID)[0];
const curveAta = PublicKey.findProgramAddressSync([curvePda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()], ATA_PROGRAM_ID)[0];

console.log('=== SMOKE SELL (round-trip) ===');
console.log('traderAta:', traderAta.toBase58());
console.log('curveAta:', curveAta.toBase58());

const traderInfo = await connection.getAccountInfo(traderAta);
if (!traderInfo || !traderInfo.owner.equals(TOKEN_PROGRAM_ID)) { console.log('No trader ATA'); process.exit(1); }

const traderView = new DataView(traderInfo.data.buffer, traderInfo.data.byteOffset, traderInfo.data.byteLength);
const tokenBalanceRaw = traderView.getBigUint64(0, true);
const tokenBalance = Number(tokenBalanceRaw) / 1e6;
console.log('Trader token balance:', tokenBalance.toFixed(6));

// Fetch LIVE curve state
const curveInfo = await connection.getAccountInfo(curvePda);
if (!curveInfo) { console.log('Curve not found'); process.exit(1); }
const cv = new DataView(curveInfo.data.buffer, curveInfo.data.byteOffset, curveInfo.data.byteLength);
let off = 8 + 32 + 32;
const virtTok = cv.getBigUint64(off, true); off += 8;
const virtSol = cv.getBigUint64(off, true); off += 8;
off += 8;
const realSol = cv.getBigUint64(off, true); off += 8;
const complete = cv.getUint8(off);
console.log('Curve: virtTok=', Number(virtTok).toLocaleString(), 'virtSol=', Number(virtSol).toLocaleString(), 'realSol=', Number(realSol).toLocaleString(), 'complete=', complete);

if (complete === 1) { console.log('Curve complete — cannot sell'); process.exit(1); }

const FEE_BPS = 25n, BPS = 10000n, MAX_BPS = 5000n;
const V_TOK0 = virtTok > 0n ? virtTok : 1073000000000000n;
const V_SOL0 = virtSol > 0n ? virtSol : 30000000000n;
const k = V_SOL0 * V_TOK0;
const maxVirtual = (V_TOK0 * MAX_BPS) / BPS;
const sellAmt = tokenBalanceRaw > maxVirtual ? maxVirtual : tokenBalanceRaw;

// Enforce real SOL cap: sol_gross <= realSol
const solGross = V_SOL0 - k / (V_TOK0 + sellAmt);
const feeAmt = (solGross * FEE_BPS * 2n) / BPS;
const solOut = solGross - feeAmt;
console.log('Sell amt (virtual cap):', Number(sellAmt).toLocaleString());
console.log('Sol out:', Number(solOut) / 1e9, 'SOL (req:', Number(solGross).toLocaleString(), 'lamports, have:', Number(realSol).toLocaleString(), ')');

// If exceeds real SOL, scale down
let finalSell = sellAmt;
if (solGross > realSol) {
  const targetVs = V_SOL0 - realSol;
  const exact = (k / targetVs) - V_TOK0;
  finalSell = exact > 0n ? (exact * 90n) / 100n : 0n;
  console.log('Scaling to real SOL cap. Final sell:', Number(finalSell).toLocaleString());
}

// Recompute with final
const k2 = V_SOL0 * V_TOK0;
const vt2 = V_TOK0 + finalSell;
const vs2 = k2 / vt2;
const sg2 = V_SOL0 - vs2;
const fee2 = (sg2 * FEE_BPS * 2n) / BPS;
const so2 = sg2 - fee2;
const mo2 = (so2 * 99n) / 100n;
console.log('Final SOL out:', Number(so2) / 1e9, 'SOL');
console.log('Min SOL out:', Number(mo2) / 1e9, 'SOL');

const DISC_SELL = Uint8Array.from([0x33, 0xe6, 0x85, 0xa4, 0x01, 0x7f, 0x83, 0xad]);
function u64(n) { const b = new Uint8Array(8); new DataView(b.buffer).setBigUint64(0, n, true); return b; }

const sellIx = new TransactionInstruction({
  programId: PROGRAM_ID,
  keys: [
    { pubkey: configPda, isSigner: false, isWritable: false },
    { pubkey: curvePda, isSigner: false, isWritable: true },
    { pubkey: MINT, isSigner: false, isWritable: false },
    { pubkey: curveAta, isSigner: false, isWritable: true },
    { pubkey: traderAta, isSigner: false, isWritable: true },
    { pubkey: TRADER, isSigner: true, isWritable: true },
    { pubkey: FEE_WALLET, isSigner: false, isWritable: true },
    { pubkey: CREATOR_WALLET, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ATA_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ],
  data: Buffer.from(Uint8Array.from([...DISC_SELL, ...u64(finalSell), ...u64(mo2)])),
});

const tx = new Transaction();
tx.add(ComputeBudgetProgram.requestHeapFrame({ bytes: 256 * 1024 }));
tx.add(sellIx);
tx.feePayer = TRADER;
const { blockhash: bh } = await connection.getLatestBlockhash();
tx.recentBlockhash = bh;
tx.sign(kp);
console.log('Sending sell...');
try {
  const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
  console.log('SELL SIG:', sig);
  console.log('Explorer: https://explorer.solana.com/tx/' + sig + '?cluster=devnet');
  fs.writeFileSync('/tmp/smoke-sell-sig.txt', sig);
} catch (e) {
  console.log('SELL FAILED:', e.message);
  if (e.transactionLogs) console.log('Logs:', e.transactionLogs.join('\n'));
}
