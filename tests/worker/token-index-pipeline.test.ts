/**
 * Worker integration tests for the token indexing pipeline.
 *
 * Tests POST /api/tokens/index and GET /api/tokens against the LIVE
 * deployed worker using real devnet RPCs. These are regression guards:
 * they must FAIL if indexing breaks (bad signature handling, missing
 * mint persistence, schema drift, worker errors).
 *
 * Run: npm run test:worker
 */

import { describe, expect, it } from 'vitest';

const API = process.env.HERMES_API_BASE ?? 'https://hermes-api.tahamtandariush.workers.dev';

// ---- proven devnet creates (DEPLOY.md) ----
const HNQ = {
  name: 'Hera Nostro Quay',
  ticker: 'HNQ',
  emoji: '🔱',
  creator: 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a',
  mint: 'HnqNovn7kkJbCbwxMYuxZDgGQoMAbmnbLxpFooCwnKbJ',
  signature: '5dyWsG1VpGz6QzmGUfpyZTMAAe9WghtyiXeNk6jJBwhsYJ5A8LQH3QsiybAo8zB8L3ctCxYEqsXS2vwxAiXwcxT9',
};

const PUBKEY_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

async function postIndex(body: unknown): Promise<Response> {
  return fetch(`${API}/api/tokens/index`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function getTokens(): Promise<Response> {
  return fetch(`${API}/api/tokens`);
}

// ---------------------------------------------------------------------------
// Positive path: real devnet create signature indexes successfully
// ---------------------------------------------------------------------------
describe('POST /api/tokens/index (integration)', () => {
  it('returns 200/201 and a token record for a proven devnet create signature', async () => {
    const res = await postIndex(HNQ);
    const body = await res.json() as {
      ok?: boolean;
      onchainMint?: string;
      id?: string;
      already?: boolean;
      provenance?: string;
      error?: string;
    };

    expect(res.status).toBeLessThan(300);
    expect(body.ok).toBe(true);
    expect(body.onchainMint).toBe(HNQ.mint);
    expect(body.provenance).toBe('onchain');

    // id is deterministic: `${ticker.toLowerCase()}-${sig.slice(0,4)}`
    expect(body.id).toBe(`hnq-${HNQ.signature.slice(0, 4)}`);
    expect(PUBKEY_RE.test(body.onchainMint!)).toBe(true);
  }, 30000);
});

// ---------------------------------------------------------------------------
// GET /api/tokens verification: onchainMint recorded
// ---------------------------------------------------------------------------
describe('GET /api/tokens (integration)', () => {
  it('exposes onchainMint >= 1 (recorded) for the indexed devnet token', async () => {
    const res = await getTokens();
    expect(res.status).toBe(200);

    const list = await res.json() as Array<{
      id?: string;
      onchainMint?: string;
      mint?: string;
      provenance?: string;
    }>;

    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);

    const hit = list.find((t) => t.onchainMint === HNQ.mint || t.mint === HNQ.mint);
    expect(hit).toBeTruthy();
    expect(hit!.onchainMint).toBe(HNQ.mint);
    expect(PUBKEY_RE.test(hit!.onchainMint!)).toBe(true);
  }, 10000);
});

// ---------------------------------------------------------------------------
// Regression guard: bad signature must fail (not index garbage)
// ---------------------------------------------------------------------------
describe('POST /api/tokens/index — regression guards', () => {
  it('rejects a malformed / non-existent signature with 403', async () => {
    const res = await postIndex({
      name: 'Bad Sig',
      ticker: 'BAD',
      emoji: '❌',
      creator: HNQ.creator,
      mint: HNQ.mint,
      signature: 'x'.repeat(88), // structurally valid length, but non-existent
    });
    const body = await res.json() as { ok?: boolean; error?: string };

    expect(res.status).toBe(403);
    expect(body.ok).toBeUndefined();
    expect(body.error).toBeTruthy();
  }, 30000);

  it('rejects when required fields are missing (400)', async () => {
    const res = await postIndex({
      name: 'No Mint',
      ticker: 'NOMINT',
      emoji: '🚫',
      creator: HNQ.creator,
      // mint + signature intentionally omitted
    });
    const body = await res.json() as { ok?: boolean; error?: string };

    expect(res.status).toBe(400);
    expect(body.ok).toBeUndefined();
    expect(body.error).toBeTruthy();
  });

  it('rejects an invalid mint pubkey (403 — verifyCreateTransaction fails)', async () => {
    const res = await postIndex({
      name: 'Bad Mint',
      ticker: 'BMINT',
      emoji: '🚫',
      creator: HNQ.creator,
      mint: 'not-a-pubkey',
      signature: HNQ.signature,
    });
    const body = await res.json() as { ok?: boolean; error?: string };

    expect(res.status).toBe(403);
    expect(body.ok).toBeUndefined();
  }, 30000);
});
