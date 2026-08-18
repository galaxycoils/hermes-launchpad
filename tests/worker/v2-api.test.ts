import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock worker.js to provide json/err helpers (they are module-scoped in worker.js but route files import them)
vi.mock('../../workers/worker.js', () => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Wallet-Signature, Wallet-Nonce',
  };
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors } });
  const err = (msg: string, status = 400) => json({ error: msg }, status);
  return { json, err };
});

const WALLET = 'GkHE2vb8j3PGyjMvCmWJMffiKb2QwVye5TfuUPG1NK5a';
const TARGET = '9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz';

// Import route handlers after mock
import {
  handleGetProfile,
  handleUpdateProfile,
  handleGetPortfolio,
  handleGetTradeHistory,
  handleGetAchievements,
} from '../../workers/src/routes/profile.js';
import {
  handleFollow,
  handleUnfollow,
  handleGetFeed,
  handleGetLeaderboard,
  handleGetFollowers,
  handleGetFollowing,
} from '../../workers/src/routes/social.js';
import {
  handleCheckin,
  handleGetQuests,
  handleClaimQuest,
} from '../../workers/src/routes/quests.js';
import {
  handleGetReferrals,
  handleValidateReferral,
  handleApplyReferral,
  handleGetReferralLeaderboard,
} from '../../workers/src/routes/referrals.js';

// ---------------------------------------------------------------------------
// Mock D1 database helper
// ---------------------------------------------------------------------------
function createMockDb(overrides: Record<string, any> = {}) {
  const queries: Array<{ sql: string; args: unknown[] }> = [];

  const prepare = (sql: string) => {
    const stmt = {
      bind(...args: unknown[]) {
        queries.push({ sql, args });
        return this;
      },
      async first() {
        if (overrides.first) return overrides.first(sql, this._boundArgs || []);
        return null;
      },
      async all() {
        if (overrides.all) return overrides.all(sql, this._boundArgs || []);
        return { results: [] };
      },
      async run() {
        if (overrides.run) return overrides.run(sql, this._boundArgs || []);
        return { success: true, meta: { changes: 1 } };
      },
    };

    // Support direct .all() without bind() — return a statement that tracks no args
    const directStmt = {
      async all() {
        if (overrides.all) return overrides.all(sql, []);
        return { results: [] };
      },
      async first() {
        if (overrides.first) return overrides.first(sql, []);
        return null;
      },
      async run() {
        if (overrides.run) return overrides.run(sql, []);
        return { success: true, meta: { changes: 1 } };
      },
    };

    // Return a hybrid: bind() returns stmt (with tracking), but the object itself
    // also supports direct .all()/.first()/.run()
    return Object.assign(directStmt, {
      bind(...args: unknown[]) {
        queries.push({ sql, args });
        (stmt as any)._boundArgs = args;
        return stmt;
      },
    }) as any;
  };

  return { prepare, queries };
}

afterEach(() => vi.restoreAllMocks());

// ---------------------------------------------------------------------------
// Profile routes
// ---------------------------------------------------------------------------
describe('profile routes', () => {
  describe('GET /api/profile/:wallet', () => {
    it('returns profile data with computed rank and win rate', async () => {
      const db = createMockDb({
        first: (sql: string) => {
          if (sql.includes('WHERE wallet =')) {
            return {
              wallet: WALLET,
              xp: 12000,
              level: 7,
              streak_days: 5,
              ref_code: 'abc123',
              referred_by: null,
              trades: 20,
              wins: 12,
              pnl: 150.5,
              display_name: 'TestTrader',
              avatar_url: 'https://example.com/avatar.png',
              rank: 'expert',
              created_at: 1700000000,
            };
          }
          return null;
        },
      });

      const res = await handleGetProfile(db, WALLET);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.wallet).toBe(WALLET);
      expect(body.displayName).toBe('TestTrader');
      expect(body.xp).toBe(12000);
      expect(body.rank).toBe('expert');
      expect(body.stats.winRate).toBe(60);
      expect(body.stats.pnl).toBe(150.5);
    });

    it('returns 400 for invalid wallet', async () => {
      const db = createMockDb();
      const res = await handleGetProfile(db, '!!');
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('invalid wallet');
    });

    it('returns 404 when profile not found', async () => {
      const db = createMockDb({ first: () => null });
      const res = await handleGetProfile(db, WALLET);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('profile not found');
    });

    it('computes rank from xp when rank column is null', async () => {
      const db = createMockDb({
        first: (sql: string) => {
          if (sql.includes('WHERE wallet =')) {
            return {
              wallet: WALLET,
              xp: 60000,
              level: 10,
              streak_days: 0,
              ref_code: null,
              referred_by: null,
              trades: 0,
              wins: 0,
              pnl: 0,
              display_name: null,
              avatar_url: null,
              rank: null,
              created_at: 1700000000,
            };
          }
          return null;
        },
      });

      const res = await handleGetProfile(db, WALLET);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.rank).toBe('legend');
    });
  });

  describe('PUT /api/profile/:wallet', () => {
    it('updates display_name and avatar_url', async () => {
      const db = createMockDb({
        first: () => ({ wallet: WALLET }),
        run: () => ({ success: true, meta: { changes: 1 } }),
      });

      const res = await handleUpdateProfile(db, WALLET, {
        displayName: 'NewName',
        avatarUrl: 'https://example.com/new.png',
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });

    it('returns 400 for invalid wallet', async () => {
      const db = createMockDb();
      const res = await handleUpdateProfile(db, 'x', { displayName: 'test' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when no valid fields provided', async () => {
      const db = createMockDb();
      const res = await handleUpdateProfile(db, WALLET, {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('no valid fields to update');
    });

    it('creates profile if it does not exist', async () => {
      let created = false;
      const db = createMockDb({
        first: () => null,
        run: (sql: string) => {
          if (sql.startsWith('INSERT INTO profiles')) created = true;
          return { success: true, meta: { changes: 1 } };
        },
      });

      const res = await handleUpdateProfile(db, WALLET, { displayName: 'New' });
      expect(res.status).toBe(200);
      expect(created).toBe(true);
    });
  });

  describe('GET /api/profile/:wallet/portfolio', () => {
    it('returns holdings with computed PnL', async () => {
      const db = createMockDb({
        all: (sql: string) => {
          if (sql.includes('FROM positions')) {
            return {
              results: [
                {
                  token_id: '1',
                  tokens: 100,
                  avg_cost: 0.01,
                  name: 'Test Token',
                  ticker: 'TEST',
                  emoji: '🚀',
                  current_price: 0.05,
                },
              ],
            };
          }
          return { results: [] };
        },
      });

      const res = await handleGetPortfolio(db, WALLET);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.holdings).toHaveLength(1);
      expect(body.holdings[0].pnl).toBe(4);
      expect(body.holdings[0].pnlPercent).toBe(400);
      expect(body.summary.totalValue).toBe(5);
      expect(body.summary.positions).toBe(1);
    });

    it('returns empty holdings for new wallet', async () => {
      const db = createMockDb({ all: () => ({ results: [] }) });
      const res = await handleGetPortfolio(db, WALLET);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.holdings).toEqual([]);
      expect(body.summary.totalValue).toBe(0);
    });

    it('returns 400 for invalid wallet', async () => {
      const db = createMockDb();
      const res = await handleGetPortfolio(db, '!!');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/profile/:wallet/trades', () => {
    it('returns paginated trade history', async () => {
      const db = createMockDb({
        all: (sql: string) => {
          if (sql.includes('FROM trades')) {
            return {
              results: [
                {
                  id: '1',
                  token_id: '10',
                  side: 'buy',
                  sol_amount: 1.5,
                  token_amount: 1000,
                  price: 0.0015,
                  ts: 1700000000,
                  source: 'demo',
                  name: 'Test Token',
                  ticker: 'TEST',
                  emoji: '🚀',
                },
              ],
            };
          }
          return { results: [] };
        },
        first: (sql: string) => {
          if (sql.includes('COUNT')) return { c: 1 };
          return null;
        },
      });

      const url = new URL('https://worker.test/api/profile/' + WALLET + '/trades?page=1&limit=20');
      const res = await handleGetTradeHistory(db, WALLET, url);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.trades).toHaveLength(1);
      expect(body.trades[0].side).toBe('buy');
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.total).toBe(1);
    });

    it('respects custom page and limit params', async () => {
      const db = createMockDb({
        all: () => ({ results: [] }),
        first: () => ({ c: 100 }),
      });

      const url = new URL('https://worker.test/api/profile/' + WALLET + '/trades?page=3&limit=10');
      const res = await handleGetTradeHistory(db, WALLET, url);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pagination.page).toBe(3);
      expect(body.pagination.limit).toBe(10);
      expect(body.pagination.totalPages).toBe(10);
    });

    it('returns 400 for invalid wallet', async () => {
      const db = createMockDb();
      const url = new URL('https://worker.test/api/profile/!!/trades');
      const res = await handleGetTradeHistory(db, '!!', url);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/profile/:wallet/achievements', () => {
    it('returns all badges with unlocked status', async () => {
      const db = createMockDb({
        all: () => ({
          results: [
            { badge_id: 'first_trade', unlocked_at: 1700000000, token_id: null },
            { badge_id: 'streak_7', unlocked_at: 1700100000, token_id: null },
          ],
        }),
      });

      const res = await handleGetAchievements(db, WALLET);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalCount).toBe(14);
      expect(body.unlockedCount).toBe(2);
      const firstTrade = body.badges.find((b: any) => b.id === 'first_trade');
      expect(firstTrade.unlocked).toBe(true);
      expect(firstTrade.unlockedAt).toBe(1700000000);
      const whale = body.badges.find((b: any) => b.id === 'trader_100');
      expect(whale.unlocked).toBe(false);
    });

    it('returns 400 for invalid wallet', async () => {
      const db = createMockDb();
      const res = await handleGetAchievements(db, '!!');
      expect(res.status).toBe(400);
    });
  });
});

// ---------------------------------------------------------------------------
// Social routes
// ---------------------------------------------------------------------------
describe('social routes', () => {
  describe('POST /api/follow/:wallet', () => {
    it('follows a target wallet', async () => {
      let inserted = false;
      const db = createMockDb({
        first: (sql: string) => {
          if (sql.includes('SELECT wallet FROM profiles')) return { wallet: TARGET };
          if (sql.includes('SELECT 1 x FROM follows')) return null;
          return null;
        },
        run: (sql: string) => {
          if (sql.startsWith('INSERT INTO follows')) inserted = true;
          return { success: true, meta: { changes: 1 } };
        },
      });

      const res = await handleFollow(db, TARGET, { wallet: WALLET });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.followed).toBe(true);
      expect(inserted).toBe(true);
    });

    it('returns already:true when already following', async () => {
      const db = createMockDb({
        first: () => ({ wallet: TARGET }),
      });

      const res = await handleFollow(db, TARGET, { wallet: WALLET });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.already).toBe(true);
    });

    it('returns 400 when following yourself', async () => {
      const db = createMockDb();
      const res = await handleFollow(db, WALLET, { wallet: WALLET });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('cannot follow yourself');
    });

    it('returns 400 for invalid target wallet', async () => {
      const db = createMockDb();
      const res = await handleFollow(db, '!!', { wallet: WALLET });
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid follower wallet', async () => {
      const db = createMockDb();
      const res = await handleFollow(db, TARGET, { wallet: '!!' });
      expect(res.status).toBe(400);
    });

    it('returns 404 when target profile not found', async () => {
      const db = createMockDb({
        first: () => null,
      });

      const res = await handleFollow(db, TARGET, { wallet: WALLET });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('target profile not found');
    });
  });

  describe('DELETE /api/follow/:wallet', () => {
    it('unfollows a target wallet', async () => {
      const db = createMockDb({
        run: () => ({ success: true, meta: { changes: 1 } }),
      });

      const res = await handleUnfollow(db, TARGET, { wallet: WALLET });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.unfollowed).toBe(true);
    });

    it('returns 404 when not following', async () => {
      const db = createMockDb({
        run: () => ({ success: true, meta: { changes: 0 } }),
      });

      const res = await handleUnfollow(db, TARGET, { wallet: WALLET });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('not following');
    });

    it('returns 400 for invalid target wallet', async () => {
      const db = createMockDb();
      const res = await handleUnfollow(db, '!!', { wallet: WALLET });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/feed/:wallet', () => {
    it('returns activity from followed wallets', async () => {
      const db = createMockDb({
        all: (sql: string) => {
          if (sql.includes('FROM trades')) {
            return {
              results: [
                {
                  id: '1',
                  token_id: '10',
                  wallet: TARGET,
                  side: 'buy',
                  sol_amount: 1,
                  token_amount: 500,
                  price: 0.002,
                  ts: 1700000000,
                  name: 'Test Token',
                  ticker: 'TEST',
                  emoji: '🚀',
                },
              ],
            };
          }
          return { results: [] };
        },
        first: (sql: string) => {
          if (sql.includes('COUNT')) return { c: 5 };
          return null;
        },
      });

      const url = new URL('https://worker.test/api/feed/' + WALLET);
      const res = await handleGetFeed(db, WALLET, url);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.activities).toHaveLength(1);
      expect(body.activities[0].type).toBe('trade');
      expect(body.stats.following).toBe(5);
    });

    it('returns 400 for invalid wallet', async () => {
      const db = createMockDb();
      const url = new URL('https://worker.test/api/feed/!!');
      const res = await handleGetFeed(db, '!!', url);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/leaderboard', () => {
    it('returns XP leaderboard by default', async () => {
      const db = createMockDb({
        all: () => ({
          results: [
            { wallet: WALLET, xp: 50000, level: 10, trades: 100, wins: 60, pnl: 500, display_name: 'Top' },
            { wallet: TARGET, xp: 25000, level: 8, trades: 50, wins: 30, pnl: 200, display_name: null },
          ],
        }),
      });

      const url = new URL('https://worker.test/api/leaderboard');
      const res = await handleGetLeaderboard(db, url);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.type).toBe('xp');
      expect(body.leaderboard).toHaveLength(2);
      expect(body.leaderboard[0].rank).toBe(1);
      expect(body.leaderboard[0].xp).toBe(50000);
    });

    it('returns PnL leaderboard when type=pnl', async () => {
      const db = createMockDb({
        all: () => ({
          results: [
            { wallet: WALLET, xp: 1000, level: 3, trades: 10, wins: 5, pnl: 9999, display_name: null },
          ],
        }),
      });

      const url = new URL('https://worker.test/api/leaderboard?type=pnl');
      const res = await handleGetLeaderboard(db, url);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.type).toBe('pnl');
    });

    it('returns referrals leaderboard when type=referrals', async () => {
      const db = createMockDb({
        all: () => ({
          results: [
            { wallet: WALLET, xp: 1000, level: 3, trades: 10, wins: 5, pnl: 100, display_name: null, referral_count: 10 },
          ],
        }),
      });

      const url = new URL('https://worker.test/api/leaderboard?type=referrals');
      const res = await handleGetLeaderboard(db, url);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.type).toBe('referrals');
      expect(body.leaderboard[0].referrals).toBe(10);
    });
  });

  describe('GET /api/profile/:wallet/followers', () => {
    it('returns followers list', async () => {
      const db = createMockDb({
        all: () => ({
          results: [
            { follower: TARGET, created_at: '2024-01-01', xp: 5000, level: 5, display_name: 'Follower1' },
          ],
        }),
      });

      const res = await handleGetFollowers(db, WALLET);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.followers).toHaveLength(1);
      expect(body.followers[0].wallet).toBe(TARGET);
      expect(body.count).toBe(1);
    });

    it('returns 400 for invalid wallet', async () => {
      const db = createMockDb();
      const res = await handleGetFollowers(db, '!!');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/profile/:wallet/following', () => {
    it('returns following list', async () => {
      const db = createMockDb({
        all: () => ({
          results: [
            { following: TARGET, created_at: '2024-01-01', xp: 5000, level: 5, display_name: 'Target' },
          ],
        }),
      });

      const res = await handleGetFollowing(db, WALLET);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.following).toHaveLength(1);
      expect(body.following[0].wallet).toBe(TARGET);
    });

    it('returns 400 for invalid wallet', async () => {
      const db = createMockDb();
      const res = await handleGetFollowing(db, '!!');
      expect(res.status).toBe(400);
    });
  });
});

// ---------------------------------------------------------------------------
// Quests routes
// ---------------------------------------------------------------------------
describe('quests routes', () => {
  describe('POST /api/checkin', () => {
    it('performs first checkin and awards XP', async () => {
      let updated = false;
      const db = createMockDb({
        first: (sql: string) => {
          if (sql.includes('SELECT * FROM profiles')) {
            return { wallet: WALLET, xp: 0, level: 1, streak_days: 0, last_active_day: null };
          }
          return null;
        },
        run: (sql: string) => {
          if (sql.includes('UPDATE profiles SET streak_days')) updated = true;
          return { success: true, meta: { changes: 1 } };
        },
      });

      const res = await handleCheckin(db, { wallet: WALLET });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.streak).toBe(1);
      expect(body.xpGained).toBe(100);
      expect(updated).toBe(true);
    });

    it('returns already:true when checked in today', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const db = createMockDb({
        first: () => ({ wallet: WALLET, xp: 500, level: 2, streak_days: 3, last_active_day: today }),
      });

      const res = await handleCheckin(db, { wallet: WALLET });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.already).toBe(true);
      expect(body.xpGained).toBe(0);
    });

    it('returns 400 for invalid wallet', async () => {
      const db = createMockDb();
      const res = await handleCheckin(db, { wallet: '!!' });
      expect(res.status).toBe(400);
    });

    it('creates profile if not exists', async () => {
      let created = false;
      const db = createMockDb({
        first: (sql: string) => {
          if (sql.includes('SELECT * FROM profiles')) return null;
          return null;
        },
        run: (sql: string) => {
          if (sql.startsWith('INSERT INTO profiles')) created = true;
          return { success: true, meta: { changes: 1 } };
        },
      });

      const res = await handleCheckin(db, { wallet: WALLET });
      expect(res.status).toBe(200);
      expect(created).toBe(true);
    });
  });

  describe('GET /api/quests/:wallet', () => {
    it('returns daily quests with progress', async () => {
      const db = createMockDb({
        all: () => ({ results: [] }),
        first: () => ({ c: 0 }),
      });

      const res = await handleGetQuests(db, WALLET);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.quests).toHaveLength(5);
      expect(body.quests[0]).toHaveProperty('id');
      expect(body.quests[0]).toHaveProperty('title');
      expect(body.quests[0]).toHaveProperty('xp');
      expect(body.quests[0]).toHaveProperty('progress');
      expect(body.quests[0]).toHaveProperty('done');
    });

    it('returns 400 for invalid wallet', async () => {
      const db = createMockDb();
      const res = await handleGetQuests(db, '!!');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/quests/:wallet/claim', () => {
    it('claims a completed quest and awards XP', async () => {
      const db = createMockDb({
        first: (sql: string) => {
          if (sql.includes('SELECT progress, done')) return null;
          if (sql.includes('SELECT COUNT(*)') && sql.includes('trades')) return { c: 5 };
          if (sql.includes('SELECT xp, level')) return { xp: 1000, level: 3 };
          return null;
        },
        run: () => ({ success: true, meta: { changes: 1 } }),
      });

      const res = await handleClaimQuest(db, WALLET, { questId: 'daily_trades' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.questId).toBe('daily_trades');
      expect(body.xpGained).toBe(500);
    });

    it('returns 409 when quest already claimed', async () => {
      const db = createMockDb({
        first: () => ({ progress: 3, done: 1 }),
      });

      const res = await handleClaimQuest(db, WALLET, { questId: 'daily_trades' });
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe('already claimed');
    });

    it('returns 409 when quest not yet complete', async () => {
      const db = createMockDb({
        first: (sql: string) => {
          if (sql.includes('SELECT progress, done')) return null;
          if (sql.includes('SELECT COUNT(*)')) return { c: 1 };
          return null;
        },
      });

      const res = await handleClaimQuest(db, WALLET, { questId: 'daily_trades' });
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe('quest not yet complete');
    });

    it('returns 404 for unknown quest', async () => {
      const db = createMockDb({ first: () => null });
      const res = await handleClaimQuest(db, WALLET, { questId: 'nonexistent' });
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid wallet', async () => {
      const db = createMockDb();
      const res = await handleClaimQuest(db, '!!', { questId: 'daily_trades' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when questId missing', async () => {
      const db = createMockDb();
      const res = await handleClaimQuest(db, WALLET, {});
      expect(res.status).toBe(400);
    });
  });
});

// ---------------------------------------------------------------------------
// Referrals routes
// ---------------------------------------------------------------------------
describe('referrals routes', () => {
  describe('GET /api/referrals/:wallet', () => {
    it('returns referral stats and referred users', async () => {
      const db = createMockDb({
        first: (sql: string) => {
          if (sql.includes('SELECT * FROM profiles')) {
            return { wallet: WALLET, xp: 5000, level: 5, ref_code: 'abc12345' };
          }
          return null;
        },
        all: (sql: string) => {
          if (sql.includes('FROM profiles p')) {
            return {
              results: [
                { wallet: TARGET, xp: 1000, level: 3, created_at: 1700000000, total_fees_generated: 50, total_credits: 25 },
              ],
            };
          }
          if (sql.includes('SELECT wallet, COUNT')) {
            return { results: [{ wallet: WALLET, ref_count: 1 }] };
          }
          return { results: [] };
        },
      });

      const res = await handleGetReferrals(db, WALLET);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.code).toBe('abc12345');
      expect(body.link).toContain('abc12345');
      expect(body.stats.totalReferred).toBe(1);
      expect(body.stats.xpEarned).toBe(750);
      expect(body.referred).toHaveLength(1);
    });

    it('creates profile with ref code if not exists', async () => {
      let created = false;
      const db = createMockDb({
        first: () => null,
        run: (sql: string) => {
          if (sql.startsWith('INSERT INTO profiles')) created = true;
          return { success: true, meta: { changes: 1 } };
        },
        all: () => ({ results: [] }),
      });

      const res = await handleGetReferrals(db, WALLET);
      expect(res.status).toBe(200);
      expect(created).toBe(true);
    });

    it('returns 400 for invalid wallet', async () => {
      const db = createMockDb();
      const res = await handleGetReferrals(db, '!!');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/referrals/validate', () => {
    it('validates a correct referral code', async () => {
      const db = createMockDb({
        first: () => ({ wallet: TARGET, xp: 10000, level: 7, ref_code: 'validcode' }),
      });

      const res = await handleValidateReferral(db, { code: 'validcode' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.valid).toBe(true);
      expect(body.referrer).toBe(TARGET);
      expect(body.code).toBe('validcode');
    });

    it('validates by wallet address', async () => {
      // Use a short wallet address that passes the 3-32 char length check
      const shortWallet = 'Abc123Xy';
      const db = createMockDb({
        first: () => ({ wallet: shortWallet, xp: 5000, level: 5, ref_code: 'mycode' }),
      });

      const res = await handleValidateReferral(db, { code: shortWallet });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.valid).toBe(true);
    });

    it('returns 404 for invalid code', async () => {
      const db = createMockDb({ first: () => null });
      const res = await handleValidateReferral(db, { code: 'wrongcode' });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('invalid referral code');
    });

    it('returns 400 when code is missing', async () => {
      const db = createMockDb();
      const res = await handleValidateReferral(db, {});
      expect(res.status).toBe(400);
    });

    it('returns 400 for code too short', async () => {
      const db = createMockDb();
      const res = await handleValidateReferral(db, { code: 'ab' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for code too long', async () => {
      const db = createMockDb();
      const res = await handleValidateReferral(db, { code: 'a'.repeat(33) });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/referrals/apply', () => {
    it('applies referral code successfully', async () => {
      let insertedReferral = false;
      const db = createMockDb({
        first: (sql: string) => {
          if (sql.includes('SELECT * FROM profiles')) return null;
          if (sql.includes('SELECT wallet, ref_code')) return { wallet: TARGET, ref_code: 'friend123' };
          if (sql.includes('SELECT xp, level')) return { xp: 5000, level: 5 };
          return null;
        },
        run: (sql: string) => {
          if (sql.startsWith('INSERT OR IGNORE INTO referrals')) insertedReferral = true;
          return { success: true, meta: { changes: 1 } };
        },
      });

      const res = await handleApplyReferral(db, { wallet: WALLET, code: 'friend123' });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.referrer).toBe(TARGET);
      expect(body.xpGained).toBe(750);
      expect(insertedReferral).toBe(true);
    });

    it('returns 409 when referral already applied', async () => {
      const db = createMockDb({
        first: () => ({ wallet: WALLET, referred_by: TARGET }),
      });

      const res = await handleApplyReferral(db, { wallet: WALLET, code: 'friend123' });
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe('referral already applied');
    });

    it('returns 404 for invalid code', async () => {
      const db = createMockDb({
        first: (sql: string) => {
          if (sql.includes('SELECT * FROM profiles')) return null;
          if (sql.includes('SELECT wallet, ref_code')) return null;
          return null;
        },
      });

      const res = await handleApplyReferral(db, { wallet: WALLET, code: 'invalid' });
      expect(res.status).toBe(404);
    });

    it('returns 400 when referring yourself', async () => {
      const db = createMockDb({
        first: (sql: string) => {
          if (sql.includes('SELECT * FROM profiles')) return null;
          if (sql.includes('SELECT wallet, ref_code')) return { wallet: WALLET, ref_code: 'mycode' };
          return null;
        },
      });

      const res = await handleApplyReferral(db, { wallet: WALLET, code: 'mycode' });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('cannot refer yourself');
    });

    it('returns 400 for invalid wallet', async () => {
      const db = createMockDb();
      const res = await handleApplyReferral(db, { wallet: '!!', code: 'valid' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when code is missing', async () => {
      const db = createMockDb();
      const res = await handleApplyReferral(db, { wallet: WALLET });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/referrals/leaderboard', () => {
    it('returns top referrers', async () => {
      const db = createMockDb({
        all: () => ({
          results: [
            { wallet: WALLET, xp: 10000, level: 7, display_name: 'TopRef', ref_count: 20 },
            { wallet: TARGET, xp: 5000, level: 5, display_name: null, ref_count: 10 },
          ],
        }),
      });

      const res = await handleGetReferralLeaderboard(db);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.leaderboard).toHaveLength(2);
      expect(body.leaderboard[0].rank).toBe(1);
      expect(body.leaderboard[0].referrals).toBe(20);
    });
  });
});
