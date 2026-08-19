import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import TopNav from '../../src/components/TopNav';

// Keep jsdom clean between tests
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('TopNav devnet preview banner', () => {
  it('shows the devnet preview banner when on a devnet hostname', () => {
    // Mock a devnet hostname (matches isDevnet(): workers/dev/localhost)
    vi.stubGlobal('location', { hostname: 'hermes-api.workers.dev' } as Location);

    const onWalletChange = vi.fn();
    const html = renderToString(
      <MemoryRouter>
        <TopNav wallet={null} onWalletChange={onWalletChange} live={true} />
      </MemoryRouter>
    );

    // The banner text must contain both "Devnet" and "preview"
    expect(html).toContain('Devnet preview');
    expect(html).toContain('not mainnet');
  });

  it('hides the devnet preview banner on a production hostname', () => {
    vi.stubGlobal('location', { hostname: 'hermes-launchpad.example.com' } as Location);

    const onWalletChange = vi.fn();
    const html = renderToString(
      <MemoryRouter>
        <TopNav wallet={null} onWalletChange={onWalletChange} live={true} />
      </MemoryRouter>
    );

    expect(html).not.toContain('Devnet preview');
  });
});
