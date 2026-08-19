import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction, ComputeBudgetProgram, SystemProgram } from '@solana/web3.js';
import fs from 'fs';

const PROGRAM_ID = new PublicKey('9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

const MINT = new PublicKey('CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f');
const FEE_WALLET = new PublicKey('GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a');
const CREATOR_WALLET = new PublicKey('GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a');

const KP_PATH = '/Users/cmd/.config/solana/id.json';
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(KP_PATH, 'utf8'))));
const TRADER = kp.publicKey;

const connection = new Connection('https://devnet.rpcpool.com', 'confirmed');

const configPda = PublicKey.findProgramAddressSync([new TextEncoder().encode('config')], PROGRAM_ID)[0];
const curvePda = PublicKey.findProgramAddressSync([new TextEncoder().encode('curve'), MINT.toBuffer()], PROGRAM_ID)[0];
const curveAta = PublicKey.findProgramAddressSync([curvePda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()], ATA_PROGRAM_ID)[0];
const traderAta = PublicKey.findProgramAddressSync([TRADER.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()], ATA_PROGRAM_ID)[0];

// Read current curve state (AFTER buy confirmed)
const curveInfo = await connection.getAccountInfo(curvePda);
const cd = curveInfo!.data;
const vSol0 = BigInt(new DataView(cd.buffer, cd.byteOffset + 16, 8).getBigUint64(0, true));
const vTok0 = BigInt(new DataView(cd.buffer, cd.byteOffset + 24, 8).getBigUint64(0, true));

// Check trader SMOKE balance via ATA
const ataInfo = await connection.getAccountInfo(traderAta);
if (!ataInfo) { console.log('Trader ATA missing'); process.exit(1); }

// Parse ATA token balance: amount is at offset 64 in ATA (36 bytes into token account: mint(36) + amount(8)...)
// Token account: mint(32) + owner(32) + amount(8) + ...
const ataAmount = BigInt(new DataView(ataInfo.data.buffer, ataInfo.data.byteOffset + 64, 8).getBigUint64(0, true));
console.log('Trader SMOKE balance:', ataAmount.toString(), `(${(Number(ataAmount)/1e12).toFixed(6)}T)`);

// Sell 10% of tokens (conservative to avoid slippage)
const tokensToSell = ataAmount / 10n;

// Quote sell: v_tok increases, v_sol decreases
// tokens_in → new_v_tok = v_tok0 + tokens_toSell → new_v_sol = k / new_v_tok → sol_out = v_sol0 - new_v_sol
const k = vSol0 * vTok0;
const newVt = vTok0 + tokensToSell;
const newVs = k / newVt;
const solOut = vSol0 - newVs;
const FEE_BPS = 25n;
const TOTAL_FEE_BPS = FEE_BPS * 2n;
const BPS_DENOM = 10_000n;
const fee = (solOut * TOTAL_FEE_BPS) / BPS_DENOM;
const solAfterFees = solOut - fee;
const minSolOut = 1n; // test tx — accept any output

console.log(`\n=== Sell ${(Number(tokensToSell)/1e12).toFixed(6)}T SMOKE ===`);
console.log(`  v_sol: ${vSol0}  v_tok: ${vTok0}`);
console.log(`  tokensToSell: ${tokensToSell}`);
console.log(`  solOut: ${solOut}  fee: ${fee}  minSolOut: ${minSolOut}`);

function u64(n: bigint): Uint8Array {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, n, true);
  return b;
}

const DISC_SELL = Uint8Array.from([0x33, 0xe6, 0x85, 0xa4, 0x01, 0x7f, 0x83, 0xad]);

// IDL order: config, curve, mint, curve_token_account, trader_token_account, trader, fee_wallet, creator_wallet, token_program, associated_token_program, system_program
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
  data: Buffer.from(Uint8Array.from([...DISC_SELL, ...u64(tokensToSell), ...u64(minSolOut)])),
});

const tx = new Transaction();
tx.add(ComputeBudgetProgram.requestHeapFrame({ bytes: 256 * 1024 }));
tx.add(sellIx);
tx.feePayer = TRADER;

const { blockhash } = await connection.getLatestBlockhash();
tx.recentBlockhash = blockhash;
tx.sign(kp);

console.log('Sending sell...');
try {
  const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: 'confirmed' });
  console.log('\n✅ SELL SIG:', sig);
  console.log('Explorer: https://explorer.solana.com/tx/' + sig + '?cluster=devnet');
  fs.writeFileSync('/tmp/smoke-sell-sig.txt', sig);
} catch (e: any) {
  console.log('\n❌ SELL FAILED:', e.message);
  if (e.transactionLogs) console.log('Logs:', e.transactionLogs.join('\n'));
  process.exit(1);
}
