import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../../workers/worker.js';

const PROGRAM = '9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz';
const MINT = 'HnqNovn7kkJbCbwxMYuxZDgGQoMAbmnbLxpFooCwnKbJ';
const WALLET = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const SIGNATURE = '4vbiH8ChvaM2b71Dch4xuNWHviVsz4jXttdqWkDThWab1NRVDmR9pX4oVw1PbLoTy3s5K3LghHqqcJUV4LLsMvKa';

const env = () => {
  const tokens = [{ id: 'hnq-5dyw', onchain_mint: MINT }];
  const trades: Array<Record<string, unknown>> = [];
  const profiles: Array<Record<string, unknown>> = [];
  return {
    DB: {
      prepare(sql: string) {
        let args: unknown[] = [];
        return {
          bind(...values: unknown[]) { args = values; return this; },
          async first() {
            if (sql.includes('FROM trades WHERE signature')) return null;
            if (sql.includes('FROM tokens WHERE onchain_mint')) return tokens.find((t) => t.onchain_mint === args[0]) ?? null;
            if (sql.includes('FROM profiles WHERE wallet')) return profiles.find((p) => p.wallet === args[0]) ?? null;
            if (sql.includes('FROM quests')) return null;
            return null;
          },
          async run() {
            if (sql.startsWith('INSERT INTO trades')) {
              trades.push({ token_id: args[0], wallet: args[1], side: args[2], ts: args[3], signature: args[4] });
              return { success: true };
            }
            if (sql.startsWith('INSERT INTO profiles') || sql.startsWith('UPDATE profiles')) {
              profiles.push({ wallet: args[0] });
              return { success: true };
            }
            return { success: true };
          },
        };
      },
    },
    trades,
    PROGRAM_ID: PROGRAM,
    SOLANA_RPC: 'https://rpc.test',
  };
};

afterEach(() => vi.restoreAllMocks());

describe('POST /api/trades/index', () => {
  it('verifies the trade instruction before persisting the trade record', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      result: {
        meta: {
          err: null,
          logMessages: ['Program 9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz invoke [1]', 'Program log: Instruction: Buy', 'Program success'],
        },
        transaction: {
          message: {
            accountKeys: ['config', 'curve', MINT, 'curveAta', 'traderAta', WALLET, PROGRAM],
            instructions: [{ programId: PROGRAM, accounts: ['config', 'curve', MINT, 'curveAta', 'traderAta', WALLET] }],
          },
        },
      },
    }))));

    const state = env();
    const response = await worker.fetch(new Request('https://worker.test/api/trades/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mint: MINT,
        signature: SIGNATURE,
        wallet: WALLET,
        side: 'buy',
      }),
    }), state as never);

    expect(response.status).toBe(200);
    const body = await response.json() as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(state.trades).toHaveLength(1);
    expect(state.trades[0]?.signature).toBe(SIGNATURE);
  });
});
