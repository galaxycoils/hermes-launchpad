import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import TopNav from '../../src/components/TopNav';
import Home from '../../src/pages/Home';

describe('Retention Loops and Polish', () => {
  it('renders TopNav streak badge when streak is provided', () => {
    const html = renderToString(
      <TopNav wallet={null} onWalletChange={() => {}} live={true} streak={7} />
    );
    expect(html).toContain('7');
    expect(html).toContain('d');
    expect(html).toContain('🔥');
  });

  it('renders Top Degens snippet in feed', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/']}>
        <Home />
      </MemoryRouter>
    );
    expect(html).toContain('Top Degens');
  });
});
