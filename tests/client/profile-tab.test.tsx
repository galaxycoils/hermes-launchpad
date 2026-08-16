import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import Home from '../../src/pages/Home';

describe('Profile Tab and Referral Analytics', () => {
  it('renders Profile Tab with connected wallet status and referral section', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/profile']}>
        <Home initialTab="profile" />
      </MemoryRouter>
    );
    expect(html).toContain('Connected Wallet');
    expect(html).toContain('Recruit Degens');
    expect(html).toContain('Stack XP');
    expect(html).toContain('Daily Quests');
  });
});
