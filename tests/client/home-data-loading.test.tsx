import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router'

// =============================================================================
// Mocks — isolate Home's own data-loading logic from child components
// =============================================================================

const mockApi = vi.hoisted(() => ({
  fetchTokens: vi.fn(),
  fetchProfile: vi.fn(),
  checkin: vi.fn(),
  postComment: vi.fn(),
  likeToken: vi.fn(),
  fetchTrades: vi.fn(),
}))

vi.mock('@/lib/api', () => mockApi)

vi.mock('@/lib/identity', () => ({
  getAnonId: () => 'anon-test',
  captureRef: () => 'ref-1',
}))

vi.mock('@/lib/wallet', () => ({
  connectWallet: vi.fn(),
  useWalletProvider: () => ({ providerDetected: false }),
}))

vi.mock('@/lib/solana', () => ({
  signAuthChallenge: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: vi.fn() }))

// Child component stubs — Home's contract with them is out of scope here
vi.mock('@/components/TopNav', () => ({ default: () => <nav data-testid="topnav-stub" /> }))
vi.mock('@/components/KOHStrip', () => ({ default: () => <div data-testid="koh-stub" /> }))
vi.mock('@/components/LiveTicker', () => ({ default: () => <div data-testid="ticker-stub" /> }))
vi.mock('@/components/FilterBar', () => ({ default: () => <div data-testid="filterbar-stub" /> }))
vi.mock('@/components/BottomNav', () => ({ default: () => <div data-testid="bottomnav-stub" /> }))
vi.mock('@/components/TokenCard', () => ({
  default: ({ token }: { token: { id: string } }) => (
    <div data-testid="token-card">{token.id}</div>
  ),
}))
vi.mock('@/components/TokenModal', () => ({ default: () => null }))
vi.mock('@/components/CreateTokenModal', () => ({ default: () => null }))
vi.mock('@/components/GraduationModal', () => ({ default: () => null }))
vi.mock('@/components/WalletSelectorModal', () => ({ default: () => null }))

// Imports AFTER vi.mock hoisting
import Home from '../../src/pages/Home'

const mountedRoots: Root[] = []

// =============================================================================
// Helpers
// =============================================================================

function mkToken(id = 't1') {
  return {
    id,
    name: 'Test Token',
    ticker: 'TST',
    emoji: '🚀',
    lore: '',
    creator: 'creator-1',
    chain: 'SOL' as const,
  }
}

function drain() {
  return act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

function renderHome(): { container: HTMLElement; root: Root } {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
  })
  mountedRoots.push(root)
  return { container, root }
}
// ============================================================================
// Tests — regression guard for the Home data-loading effect refactor
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  mockApi.fetchTokens.mockResolvedValue({ data: [mkToken()] })
  mockApi.fetchProfile.mockResolvedValue(null)
  mockApi.fetchTrades.mockResolvedValue([])
  mockApi.checkin.mockResolvedValue(null)
})

afterEach(() => {
  while (mountedRoots.length) {
    const root = mountedRoots.pop()!
    act(() => {
      root.unmount()
    })
  }
  document.body.textContent = ''
})

describe('Home data loading regression', () => {
  it('renders skeletons on mount, then token cards once tokens resolve', async () => {
    const { container } = renderHome()

    // Loading state first: skeleton cards visible, no token cards yet
    expect(container.querySelectorAll('.animate-shimmer').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('[data-testid="token-card"]').length).toBe(0)

    await drain()

    // After resolution: token card rendered, skeletons gone
    expect(container.querySelectorAll('[data-testid="token-card"]').length).toBe(1)
    expect(container.querySelector('[data-testid="token-card"]')?.textContent).toBe('t1')
    expect(container.querySelectorAll('.animate-shimmer').length).toBe(0)

    // API was actually called by the mount effect
    expect(mockApi.fetchTokens).toHaveBeenCalled()
  }, 10_000)

  it('does not crash on unmount + remount and reloads data', async () => {
    const first = renderHome()
    await drain()
    expect(first.container.querySelectorAll('[data-testid="token-card"]').length).toBe(1)

    act(() => {
      first.root.unmount()
    })

    const second = renderHome()
    await drain()
    expect(second.container.querySelectorAll('[data-testid="token-card"]').length).toBe(1)
    expect(mockApi.fetchTokens).toHaveBeenCalledTimes(2)
  }, 10_000)

  it('error path shows Try Again; clicking it reloads and recovers', async () => {
    mockApi.fetchTokens.mockRejectedValueOnce(new Error('network down'))

    const { container } = renderHome()
    await drain()

    // Error state with retry button
    expect(container.textContent).toContain('network down')
    const retryBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Try Again')
    )
    expect(retryBtn).toBeDefined()

    // Click retry → recovery with token card (loading window is a microtask,
    // unobservable across act(); the observable contract is recovery + refetch)
    await act(async () => {
      retryBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await drain()
    expect(container.querySelectorAll('[data-testid="token-card"]').length).toBe(1)
    expect(container.textContent).not.toContain('network down')
    expect(mockApi.fetchTokens).toHaveBeenCalledTimes(2)
  }, 10_000)
})
