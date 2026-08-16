import { describe, expect, it } from 'vitest';

const API = process.env.HERMES_API_BASE ?? 'https://hermes-api.tahamtandariush.workers.dev';

const SMOKE = {
  name: 'Smoke',
  ticker: 'SMOKE',
  emoji: '🔥',
  creator: 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a',
  mint: 'CEedekzwhRZECj7eyU66FFtMSd8ziyYVzywHHs1P6x7f',
  signature: '4Q8bUzXiL8sQd1CwYakj4fmBn8RXVumeC1gH43hLMYeSfLnBSf5qtTjPuTTy2DykwzuwVH3atpRBrd53hgBVQk8C',
};

async function fetchWithRetry(url: string, options?: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw new Error('fetch failed after retries');
}

describe('Worker Live Indexing Seam', () => {
  it('POST /api/tokens/index with real create signature indexes successfully', async () => {
    const res = await fetchWithRetry(`${API}/api/tokens/index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(SMOKE),
    });
    const body = await res.json() as { ok?: boolean; onchainMint?: string; mint?: string; error?: string };
    expect(res.status).toBeLessThan(300);
    expect(body.ok).toBe(true);
    expect(body.onchainMint || body.mint).toBe(SMOKE.mint);
  }, 10000);

  it('GET /api/tokens exposes onchainMint for smoke mint', async () => {
    const res = await fetchWithRetry(`${API}/api/tokens`);
    const list = await res.json() as Array<{ onchainMint?: string; mint?: string; ticker?: string; provenance?: string }>;
    const hit = list.find((t) => t.onchainMint === SMOKE.mint || t.mint === SMOKE.mint);
    expect(hit).toBeTruthy();
    expect(hit?.onchainMint).toBe(SMOKE.mint);
  }, 10000);
});

