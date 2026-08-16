import { afterEach, describe, expect, it, vi } from 'vitest';
import { indexToken } from '@/lib/api';

afterEach(() => vi.unstubAllGlobals());

describe('indexToken', () => {
  it('posts immutable create provenance to the Worker indexer', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await indexToken({
      name: 'Hermes Heap Proof', ticker: 'HHP', emoji: '🚀',
      creator: 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a',
      mint: 'HnqNovn7kkJbCbwxMYuxZDgGQoMAbmnbLxpFooCwnKbJ',
      signature: '5dyWsG1VpGz6QzmGUfpyZTMAAe9WghtyiXeNk6jJBwhsYJ5A8LQH3QsiybAo8zB8L3ctCxYEqsXS2vwxAiXwcxT9',
    });

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/tokens/index'), expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('HnqNovn7kkJbCbwxMYuxZDgGQoMAbmnbLxpFooCwnKbJ'),
    }));
  });
});
