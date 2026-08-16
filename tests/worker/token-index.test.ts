import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../../workers/worker.js';

const PROGRAM = '9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz';
const MINT = 'HnqNovn7kkJbCbwxMYuxZDgGQoMAbmnbLxpFooCwnKbJ';
const CREATOR = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const SIGNATURE = '5dyWsG1VpGz6QzmGUfpyZTMAAe9WghtyiXeNk6jJBwhsYJ5A8LQH3QsiybAo8zB8L3ctCxYEqsXS2vwxAiXwcxT9';

const env = () => {
  const rows: Array<Record<string, unknown>> = [];
  return {
    DB: {
      prepare(sql: string) {
        let args: unknown[] = [];
        return {
          bind(...values: unknown[]) { args = values; return this; },
          async first() {
            if (sql.includes('WHERE onchain_mint')) return rows.find((row) => row.onchain_mint === args[0]) ?? null;
            return null;
          },
          async run() {
            if (sql.startsWith('INSERT INTO tokens')) {
              const [id, name, ticker, emoji, creator, mint, createdAt] = args;
              rows.push({ id, name, ticker, emoji, creator, onchain_mint: mint, created_at: createdAt });
              return { success: true };
            }
            throw new Error(`unexpected SQL: ${sql}`);
          },
        };
      },
    },
    rows,
    PROGRAM_ID: PROGRAM,
    SOLANA_RPC: 'https://rpc.test',
  };
};

afterEach(() => vi.restoreAllMocks());

describe('POST /api/tokens/index', () => {
  it('verifies the create instruction before persisting its on-chain mint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      result: {
        meta: { err: null },
        transaction: { message: {
          accountKeys: ['config', 'curve', MINT, 'curveAta', CREATOR, PROGRAM],
          instructions: [{ programId: PROGRAM, accounts: ['config', 'curve', MINT, 'curveAta', CREATOR] }],
        } },
      },
    }))));
    const state = env();
    const response = await worker.fetch(new Request('https://worker.test/api/tokens/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hermes Heap Proof', ticker: 'HHP', emoji: '🚀', creator: CREATOR,
        mint: MINT, signature: SIGNATURE,
      }),
    }), state as never);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ ok: true, onchainMint: MINT });
    expect(state.rows).toHaveLength(1);
    expect(state.rows[0]?.onchain_mint).toBe(MINT);
  });
});
