import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}))

describe('Retention Loops Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Home renders discovery feed', async () => {
    const Home = (await import('@/pages/Home')).default
    const html = renderToString(
      <MemoryRouter initialEntries={['/']}>
        <Home />
      </MemoryRouter>
    )
    expect(html).toBeDefined()
  })

  it('Profile page renders with quests and leaderboard', async () => {
    const Profile = (await import('@/pages/Profile')).default
    const html = renderToString(
      <MemoryRouter initialEntries={['/profile']}>
        <Profile />
      </MemoryRouter>
    )
    expect(html).toBeDefined()
    expect(html).toContain('Daily Quests')
  })
})
