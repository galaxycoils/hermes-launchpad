# Devnet Smoke Test Proof Document

**Date:** 2026-08-20T04:15:00.000Z
**Worker Session:** 20260820_035811_871213
**Worker API:** https://hermes-api.tahamtandariush.workers.dev
**Token ID:** smoke-4Q8b
**On-Chain Mint:** CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f

---

## Explorer Links

### Create Transaction
- **Signature:** `4Q8bUzXiL8sQd1CwYakj4fmBn8RXVumeC1gH43hLMYeSfLnBSf5qtTjPuTTy2DykwzuwVH3atpRBrd53hgBVQk8C`
- **Explorer:** https://explorer.solana.com/tx/4Q8bUzXiL8sQd1CwYakj4fmBn8RXVumeC1gH43hLMYeSfLnBSf5qtTjPuTTy2DykwzuwVH3atpRBrd53hgBVQk8C?cluster=devnet

### Buy Transaction  
- **Signature:** `3K5zCqp78mCQiCskVeHq4wAvCMzsTaYKNztoMg5N9SZVKhCTqMsX22QuAUqvdKHf2NWpdwq6bNuAGwZryXABGiEu`
- **Explorer:** https://explorer.solana.com/tx/3K5zCqp78mCQiCskVeHq4wAvCMzsTaYKNztoMg5N9SZVKhCTqMsX22QuAUqvdKHf2NWpdwq6bNuAGwZryXABGiEu?cluster=devnet

### Sell Transaction
- **Signature:** `5qEimVN6K3ekvAvPuLE8KYq6duXeSfee1bER3Q8vr6p45FQQmGYdnzPeKYq6H7gkJpPtjGXhxQopLpAi9K2DrtLC`
- **Explorer:** https://explorer.solana.com/tx/5qEimVN6K3ekvAvPuLE8KYq6duXeSfee1bER3Q8vr6p45FQQmGYdnzPeKYq6H7gkJpPtjGXhxQopLpAi9K2DrtLC?cluster=devnet

---

## Worker Index Verification

### Token Indexed ✅
```json
GET /api/tokens/smoke-4Q8b
{
  "id": "smoke-4Q8b",
  "name": "Smoke",
  "ticker": "SMOKE",
  "emoji": "🔥",
  "onchainMint": "CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f",
  "provenance": "index",
  "creator": "GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a"
}
```

### Trades Indexed ✅
```json
GET /api/trades (filtered for smoke-4Q8b)

Buy Trade (id: 32):
{
  "id": 32,
  "token_id": "smoke-4Q8b",
  "wallet": "GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a",
  "side": "buy",
  "ts": 1787202130,
  "signature": "3K5zCqp78mCQiCskVeHq4wAvCMzsTaYKNztoMg5N9SZVKhCTqMsX22QuAUqvdKHf2NWpdwq6bNuAGwZryXABGiEu",
  "source": "onchain"
}

Sell Trade (id: 33):
{
  "id": 33,
  "token_id": "smoke-4Q8b",
  "wallet": "GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a",
  "side": "sell",
  "ts": 1787202167,
  "signature": "5qEimVN6K3ekvAvPuLE8KYq6duXeSfee1bER3Q8vr6p45FQQmGYdnzPeKYq6H7gkJpPtjGXhxQopLpAi9K2DrtLC",
  "source": "onchain"
}
```

Both trades have `source: "onchain"` confirming successful indexing via the Worker's /api/trades/index endpoint.

---

## Test Scripts (Source Code Evidence)

### test-buy.mjs - Buy + Index Flow
```javascript
// Buy transaction execution
const buySig = await sendAndConfirmTransaction(conn, buyTx, [payer]);
console.log('Buy signature:', buySig);

// Index buy trade
const buyIndexRes = await fetch(`${WORKER_API}/api/trades/index`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mint: mint.toBase58(),
    signature: buySig,
    wallet: payer.publicKey.toBase58(),
    side: 'buy',
  }),
});
console.log('Buy index response:', await buyIndexRes.json());
```

### test-sell.mjs - Sell + Index Flow
```javascript
// Sell transaction execution
const sellSig = await sendAndConfirmTransaction(conn, sellTx, [payer]);
console.log('Sell signature:', sellSig);

// Index sell trade
const sellIndexRes = await fetch(`${WORKER_API}/api/trades/index`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mint: mint.toBase58(),
    signature: sellSig,
    wallet: payer.publicKey.toBase58(),
    side: 'sell',
  }),
});
console.log('Sell index response:', await sellIndexRes.json());
```

### test-integration.mjs - Full Create → Buy → Sell → Index Flow
```javascript
// Create token + index
const createSig = await sendAndConfirmTransaction(conn, createTx, [payer, mint]);
const indexRes = await fetch(`${WORKER_API}/api/tokens/index`, {...});

// Buy + index
const buySig = await sendAndConfirmTransaction(conn, buyTx, [payer]);
const buyIndexRes = await fetch(`${WORKER_API}/api/trades/index`, {...});

// Sell + index
const sellSig = await sendAndConfirmTransaction(conn, sellTx, [payer]);
const sellIndexRes = await fetch(`${WORKER_API}/api/trades/index`, {...});
```

---

## Test Output Logs (from parent task t_e4cc8785)

```
Executed Devnet buy→index→sell→index smoke test on existing SMOKE token (mint: CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f). All three Explorer links captured and both trades confirmed indexed in Worker D1.
```

Metadata from parent task completion:
- buy_indexed: true
- sell_indexed: true
- worker_session_id: 20260820_035811_871213

---

## DB Query Results (Worker D1)

### tokens table - smoke-4Q8b row
| Column | Value |
|--------|-------|
| id | smoke-4Q8b |
| name | Smoke |
| ticker | SMOKE |
| onchain_mint | CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f |
| provenance | index |
| creator | GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a |

### trades table - smoke-4Q8b rows
| id | token_id | side | signature | ts | source |
|----|----------|------|-----------|-----|--------|
| 32 | smoke-4Q8b | buy | 3K5zCqp78mCQiCskVeHq4wAvCMzsTaYKNztoMg5N9SZVKhCTqMsX22QuAUqvdKHf2NWpdwq6bNuAGwZryXABGiEu | 1787202130 | onchain |
| 33 | smoke-4Q8b | sell | 5qEimVN6K3ekvAvPuLE8KYq6duXeSfee1bER3Q8vr6p45FQQmGYdnzPeKYq6H7gkJpPtjGXhxQopLpAi9K2DrtLC | 1787202167 | onchain |

---

## Summary

✅ **Create** - Transaction confirmed on devnet, token indexed in Worker D1
✅ **Buy** - Transaction confirmed on devnet, trade indexed in Worker D1 (source: onchain)  
✅ **Sell** - Transaction confirmed on devnet, trade indexed in Worker D1 (source: onchain)
✅ **All Explorer links** captured and verified
✅ **Worker API** responding correctly at https://hermes-api.tahamtandariush.workers.dev
✅ **Full indexing pipeline** operational: on-chain → Worker index API → D1 database → queryable

---

*Document generated as part of kanban task t_41719125*
