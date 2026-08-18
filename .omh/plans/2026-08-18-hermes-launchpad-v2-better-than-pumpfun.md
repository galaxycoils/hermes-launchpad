# Hermes Launchpad v2: "Better Than Pump.fun" Plan

> **Goal:** Transform Hermes Launchpad into a measurably better, more addictive, more functional memecoin launchpad than pump.fun.
> **Approach:** Apply viral psychology (contagious), habit formation (hooked-ux), behavior design (improve-retention), and award-winning design (top-design).
> **Status:** PLAN ONLY — Do not execute.

---

## 1. Research: What Makes Pump.fun Addictive

### Core Addictive Mechanics
| Mechanic | Why It Works | Hermes Current State | Gap |
|---|---|---|---|
| **Real-time trade feed** | FOMO, social proof, variable reward | Static ticker, 15s polling | ❌ No live feed |
| **King of the Hill** | Competition, status, investment | Missing | ❌ Not implemented |
| **Instant buy/sell** | Low friction, B=MAP | Multi-step modal flow | ⚠️ Partial |
| **Creator coins** | Ownership, identity, investment | Missing | ❌ Not implemented |
| **Live chat per token** | Community, belonging, engagement | Missing | ❌ Not implemented |
| **Graduation ceremony** | Achievement, celebration, sharing | Basic modal | ⚠️ Basic |
| **Leaderboard** | Status, competition, mastery | Static snippet | ⚠️ Static |
| **Portfolio + PnL** | Investment, loss aversion, mastery | Missing | ❌ Not implemented |
| **Referral rewards** | Social currency, viral loop | Basic banner | ⚠️ Basic |
| **Mobile-first UX** | Accessibility, habit formation | Responsive but desktop-biased | ⚠️ Partial |

### Pump.fun's Psychological Hooks
1. **Variable Reward (Slot Machine):** Every trade could be 100x or rug → dopamine loop
2. **Social Proof:** Live feed shows others winning/losing → FOMO
3. **Investment Effect:** The more you trade, the more invested you become → sunk cost
4. **Status:** Leaderboards, King of the Hill, early buyer badges → social currency
5. **Ownership:** Creator coins, portfolio tracking → identity investment
6. **Anticipation:** Bonding curve progress, graduation countdown → tension/release

---

## 2. Skills to Apply

### Primary Skills
| Skill | Framework | Application |
|---|---|---|
| `contagious` | STEPPS | Viral sharing mechanics, social currency, triggers |
| `hooked-ux` | Hook Model | Habit loops, variable rewards, investment |
| `improve-retention` | B=MAP | Reduce friction, increase ability, timely prompts |
| `top-design` | Awwwards 10/10 | Award-winning visual design, motion, typography |
| `frontend-design` | Distinctive Identity | Unique visual identity, not template |
| `drive-motivation` | AMP | Autonomy, mastery, purpose in gamification |

### Supporting Skills
| Skill | Application |
|---|---|
| `e2e-critical-path` | Identify and test critical user flows |
| `visual-review` | Screenshot iteration on UI |
| `gsap-core` | Smooth animations and micro-interactions |
| `gsap-scrolltrigger` | Scroll-driven storytelling |
| `refactoring-ui` | Visual hierarchy, spacing, color polish |
| `microinteractions` | Button feedback, loading states, transitions |

---

## 3. Feature Plan: Better Than Pump.fun

### Phase 1: Real-Time Trading Experience (The "Slot Machine")
**Goal:** Make trading feel instant, exciting, and addictive.

#### 1.1 Live Trade Feed
- **What:** Real-time scrolling feed of all trades across all tokens
- **Why:** FOMO, social proof, variable reward (hooked-ux)
- **How:** WebSocket connection to worker, auto-scrolling feed with sound effects
- **Design:** Terminal-style monospace, green/red flash animations, buy/sell indicators
- **Pump.fun comparison:** Their feed is the core addictive element — we make it better with:
  - Filtering (by token, by size, by time)
  - Sound effects (toggleable)
  - Trade size highlighting (whale alerts)
  - Animated counters (total volume, active traders)

#### 1.2 Instant Trade Panel
- **What:** One-click buy/sell directly from any view
- **Why:** Reduce friction (B=MAP), increase trading frequency
- **How:** Persistent bottom sheet (mobile) or sidebar (desktop) with:
  - Token selector
  - Amount presets (0.1, 0.5, 1, 5 SOL)
  - Slippage indicator
  - One-tap execute
- **Pump.fun comparison:** Their trade panel is modal-based — we make it persistent and faster

#### 1.3 Live Price Charts
- **What:** Real-time candlestick charts with depth indicator
- **Why:** Mastery, anticipation, investment
- **How:** Lightweight Charts (TradingView) or custom canvas
- **Features:**
  - 1m, 5m, 1h, 1d timeframes
  - Bonding curve visualization
  - Trade markers on chart
  - Price alerts

### Phase 2: Gamification & Status (The "Game")
**Goal:** Make users feel progress, status, and competition.

#### 2.1 King of the Hill 2.0
- **What:** Featured token that reached most market cap in 24h
- **Why:** Competition, status, FOMO (contagious: Social Currency)
- **How:** Hero banner on homepage with:
  - Live price chart
  - "King for X hours" timer
  - Trade count
  - Holder count
  - Direct trade button
- **Pump.fun comparison:** Their KOTH is small — we make it the centerpiece

#### 2.2 Trader Profile & Reputation
- **What:** Persistent trader identity with stats and achievements
- **Why:** Investment, mastery, identity (drive-motivation: AMP)
- **How:** Profile page with:
  - Avatar, display name
  - Trading stats (total trades, win rate, PnL)
  - Achievement badges (First Trade, Whale, Early Bird, Diamond Hands)
  - Rank (Novice → Trader → Whale → Legend)
  - Portfolio history
- **Pump.fun comparison:** No persistent identity — we add investment effect

#### 2.3 Daily Streaks & Quests
- **What:** Daily login streaks and trading quests
- **Why:** Habit formation, variable reward (hooked-ux)
- **How:**
  - Streak counter (🔥 7-day streak!)
  - Daily quests: "Make 3 trades", "Buy a new token", "Share a trade"
  - XP system with level-ups
  - Reward: XP multipliers, badge unlocks
- **Pump.fun comparison:** No streaks — we add daily engagement hooks

#### 2.4 Achievement System
- **What:** Unlockable badges and milestones
- **Why:** Mastery, status, collection (drive-motivation)
- **How:**
  - First Trade, 100 Trades, 1000 Trades
  - Whale (trade > 1 SOL), Mega Whale (> 10 SOL)
  - Early Buyer (first 10 buyers of a token)
  - Diamond Hands (hold > 7 days)
  - Generous (referral earned > 1 SOL)
  - Animated unlock celebrations with confetti

### Phase 3: Social & Viral (The "Network")
**Goal:** Make every action shareable and every user a potential recruiter.

#### 3.1 Share Trade Cards
- **What:** Beautiful, shareable images of trade results
- **Why:** Social currency, practical value (contagious: STEPPS)
- **How:** Auto-generated cards with:
  - Token name, ticker, image
  - Buy/sell price, PnL percentage
  - "Trade on Hermes" watermark
  - One-tap share to Twitter/Telegram/Discord
- **Pump.fun comparison:** Basic sharing — we make it beautiful and viral

#### 3.2 Referral Program 2.0
- **What:** Multi-tier referral with real rewards
- **Why:** Viral loop, social currency (contagious)
- **How:**
  - Unique referral link per user
  - Earn 1% of referee trading fees (in platform credits)
  - Referral leaderboard (top referrers)
  - Milestone rewards (10 refs = badge, 100 refs = XP multiplier)
  - Shareable referral card with stats

#### 3.3 Token Chat Rooms
- **What:** Live chat per token page
- **Why:** Community, belonging, engagement (hooked-ux: Investment)
- **How:**
  - WebSocket-based real-time chat
  - Trader identity (from profile)
  - Emoji reactions
  - Pinned messages (creator updates)
  - Moderation tools
- **Pump.fun comparison:** Basic chat — we add identity and features

#### 3.4 Social Feed
- **What:** Activity feed of followed traders
- **Why:** Social proof, FOMO, triggers (contagious: Triggers)
- **How:**
  - Follow top traders
  - See their trades in real-time
  - Copy-trade feature (one-tap mirror)
  - Notification when followed trader makes big move

### Phase 4: Creator Experience (The "Platform")
**Goal:** Make creating tokens fun, rewarding, and viral.

#### 4.1 Token Creation Flow
- **What:** Streamlined, gamified token creation
- **Why:** Investment, autonomy, mastery (drive-motivation)
- **How:**
  - 3-step flow: Name/Image → Config → Launch
  - Preview card showing how token will look
  - "First 10 buyers get Early Bird badge" incentive
  - Creator earns 0.5% of all trades
  - Shareable launch announcement card

#### 4.2 Creator Dashboard
- **What:** Analytics and management for token creators
- **Why:** Mastery, purpose, investment
- **How:**
  - Token performance (price, volume, holders)
  - Trade feed for their token
  - Holder distribution chart
  - Chat moderation tools
  - "Promote" button (feature on homepage for fee)

#### 4.3 Graduation Ceremony 2.0
- **What:** Spectacular celebration when token graduates
- **Why:** Achievement, sharing, emotion (contagious: Emotion)
- **How:**
  - Full-screen animation with confetti
  - Shareable graduation certificate
  - Auto-post to token chat
  - Creator badge unlock
  - "Your token graduated!" push notification to holders

### Phase 5: Mobile-First UX (The "Habit")
**Goal:** Make Hermes the app users check 20+ times per day.

#### 5.1 Bottom Navigation
- **What:** Thumb-friendly bottom tab bar
- **Why:** Accessibility, habit formation (improve-retention: Ability)
- **How:**
  - Home (feed), Trade, Portfolio, Profile
  - Floating action button for quick trade
  - Swipe between tabs
  - Haptic feedback on tab switch

#### 5.2 Push Notifications
- **What:** Timely, actionable notifications
- **Why:** Triggers, FOMO, re-engagement (hooked-ux: Trigger)
- **How:**
  - Price alerts (target hit)
  - Trade notifications (followed trader bought)
  - Graduation alerts (token you hold graduated)
  - Daily streak reminder
  - Quest completion
  - Whale alert (big trade on token you hold)

#### 5.3 Gesture-Based Trading
- **What:** Swipe to trade
- **Why:** Low friction, delight, habit (improve-retivation)
- **How:**
  - Swipe right on token → Quick buy
  - Swipe left → Quick sell
  - Pull down → Refresh feed
  - Long press → Token details

---

## 4. Design System: "Better Than Pump.fun"

### Visual Identity
**Current:** Generic dark theme, template feel
**Goal:** Distinctive, premium, addictive

#### Typography
- **Display:** Custom monospace for numbers (tabular-nums), bold sans for headers
- **Body:** Clean sans-serif with excellent readability
- **Accent:** Neon green (#00ff66) for gains, neon red (#ff3366) for losses
- **Scale:** Dramatic 10:1 contrast (72px headers vs 14px body)

#### Color System
- **Background:** Deep black (#0a0a0a) with subtle gradient
- **Surface:** Dark gray (#111) with subtle border
- **Accent:** Neon green (#00ff66) for primary actions
- **Success:** Green gradient for positive PnL
- **Danger:** Red gradient for negative PnL
- **Warning:** Orange for alerts

#### Motion Design
- **Page transitions:** Smooth slide/fade (300ms)
- **Trade execution:** Satisfying "cha-ching" animation
- **Price updates:** Flash green/red on change
- **Achievement unlock:** Confetti burst + badge animation
- **Loading states:** Skeleton screens, not spinners
- **Micro-interactions:** Button press feedback, hover states

#### Information Density
- **Desktop:** Multi-column layout (feed + chart + trade panel)
- **Mobile:** Single column with bottom sheet for trading
- **Tablet:** Adaptive 2-column

---

## 5. Technical Architecture

### Real-Time Layer
- **WebSocket:** Cloudflare Durable Objects for live trade feed
- **Polling fallback:** 1s interval for price updates
- **Push:** Web Push API for notifications

### Frontend Stack
- **Framework:** React 19 + TypeScript
- **State:** Zustand for global state, React Query for server state
- **Charts:** Lightweight Charts (TradingView) or custom canvas
- **Animation:** GSAP for complex animations, CSS for micro-interactions
- **PWA:** Already configured, add push notification support

### Backend Stack
- **API:** Cloudflare Workers + D1
- **Real-time:** Durable Objects for WebSocket connections
- **Storage:** R2 for token images
- **Queue:** Cloudflare Queues for trade processing

---

## 6. Success Metrics

### Engagement Metrics
| Metric | Pump.fun Baseline | Hermes Target |
|---|---|---|
| Daily Active Users | ~50K | 25K (half, but growing) |
| Trades per user/day | 5 | 8 (more addictive) |
| Session duration | 8 min | 12 min (more engaging) |
| Return rate (D7) | 30% | 45% (better retention) |
| Referral rate | 5% | 15% (better viral loop) |

### Viral Metrics
| Metric | Target |
|---|---|
| Share rate per trade | 20% |
| Referral conversion | 30% |
| Social mentions | 500/day |
| Creator signups | 100/day |

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Real-time trade feed (WebSocket)
- [ ] Instant trade panel (persistent)
- [ ] Live price charts
- [ ] Bottom navigation (mobile)

### Phase 2: Gamification (Week 2)
- [ ] Trader profile & reputation
- [ ] Daily streaks & quests
- [ ] Achievement system
- [ ] King of the Hill 2.0

### Phase 3: Social (Week 3)
- [ ] Share trade cards
- [ ] Referral program 2.0
- [ ] Token chat rooms
- [ ] Social feed

### Phase 4: Creator (Week 4)
- [ ] Token creation flow 2.0
- [ ] Creator dashboard
- [ ] Graduation ceremony 2.0
- [ ] Push notifications

### Phase 5: Polish (Week 5)
- [ ] Motion design pass
- [ ] Sound effects
- [ ] Performance optimization
- [ ] A/B testing

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Real-time infrastructure cost | Start with polling, upgrade to WebSocket when justified |
| Gamification feels spammy | User-controlled toggles, opt-in notifications |
| Feature bloat | Ship MVP of each phase, iterate based on metrics |
| Pump.fun copies us | Move fast, build community moat |
| Regulatory concerns | No token sales, just bonding curves |

---

## 9. What Makes This "Better Than Pump.fun"

1. **More Addictive:** Variable rewards + streaks + achievements = habit formation
2. **More Social:** Chat rooms + social feed + copy-trade = network effects
3. **More Beautiful:** Award-winning design + motion = premium feel
4. **More Functional:** Instant trade + live charts + portfolio = better UX
5. **More Viral:** Share cards + referral rewards + graduation = organic growth
6. **More Rewarding:** XP + badges + leaderboards = status and mastery

---

*Plan created: 2026-08-18*
*Skills used: contagious, hooked-ux, improve-retention, top-design, frontend-design, drive-motivation, e2e-critical-path, visual-review, gsap-core, gsap-scrolltrigger, refactoring-ui, microinteractions*


---

## 10. Database Schema (New Tables)

### 10.1 Trader Profiles
```sql
CREATE TABLE IF NOT EXISTS trader_profiles (
  id TEXT PRIMARY KEY,              -- wallet address
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  rank TEXT DEFAULT 'novice',       -- novice, trader, whale, legend
  total_trades INTEGER DEFAULT 0,
  win_rate REAL DEFAULT 0.0,
  total_pnl REAL DEFAULT 0.0,        -- in SOL
  streak_days INTEGER DEFAULT 0,
  last_checkin TEXT,                 -- ISO date
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_trader_profiles_xp ON trader_profiles(xp DESC);
CREATE INDEX idx_trader_profiles_rank ON trainer_profiles(rank);
CREATE INDEX idx_trainer_profiles_referral ON trader_profiles(referral_code);
```

### 10.2 Achievements
```sql
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet TEXT NOT NULL,
  badge_id TEXT NOT NULL,           -- first_trade, whale, early_bird, etc.
  unlocked_at TEXT DEFAULT (datetime('now')),
  token_id TEXT,                     -- optional: token this was earned for
  UNIQUE(wallet, badge_id, token_id)
);

CREATE INDEX idx_achievements_wallet ON achievements(wallet);
CREATE INDEX idx_achievements_badge ON achievements(badge_id);
```

### 10.3 Daily Quests
```sql
CREATE TABLE IF NOT EXISTS daily_quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet TEXT NOT NULL,
  quest_date TEXT NOT NULL,         -- YYYY-MM-DD
  quest_type TEXT NOT NULL,         -- trade_count, new_token, share, checkin
  progress INTEGER DEFAULT 0,
  target INTEGER NOT NULL,
  completed INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 50,
  UNIQUE(wallet, quest_date, quest_type)
);

CREATE INDEX idx_daily_quests_wallet ON daily_quests(wallet, quest_date);
```

### 10.4 Follows (Social)
```sql
CREATE TABLE IF NOT EXISTS follows (
  follower TEXT NOT NULL,
  following TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (follower, following)
);

CREATE INDEX idx_follows_follower ON follows(follower);
CREATE INDEX idx_follows_following ON follows(following);
```

### 10.5 Referrals
```sql
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer TEXT NOT NULL,
  referee TEXT NOT NULL UNIQUE,
  total_fees_generated REAL DEFAULT 0.0,
  total_credits REAL DEFAULT 0.0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer);
```

### 10.6 Push Subscriptions
```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_push_subscriptions_wallet ON push_subscriptions(wallet);
```

### 10.7 Chat Messages
```sql
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id TEXT NOT NULL,
  wallet TEXT NOT NULL,
  message TEXT NOT NULL,
  reply_to INTEGER,                  -- optional: reply to message id
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_chat_messages_token ON chat_messages(token_id, created_at DESC);
```

---

## 11. API Schema (New Endpoints)

### 11.1 Trader Profile
```
GET    /api/profile/:wallet              -- Get profile
PUT    /api/profile/:wallet              -- Update display name, avatar
GET    /api/profile/:wallet/achievements -- Get unlocked badges
GET    /api/profile/:wallet/portfolio    -- Get holdings + PnL
GET    /api/profile/:wallet/trades       -- Get trade history
GET    /api/profile/:wallet/stats        -- Get trading stats
```

### 11.2 Streaks & Quests
```
POST   /api/checkin                      -- Daily checkin (streak++)
GET    /api/quests/:wallet               -- Get today's quests
POST   /api/quests/:wallet/claim         -- Claim completed quest XP
```

### 11.3 Social
```
POST   /api/follow/:wallet               -- Follow a trader
DELETE /api/follow/:wallet               -- Unfollow
GET    /api/feed/:wallet                 -- Get followed traders' activity
GET    /api/leaderboard                  -- Global leaderboard (XP, PnL, referrals)
```

### 11.4 Referrals
```
GET    /api/referrals/:wallet            -- Get referral stats
POST   /api/referrals/validate           -- Validate referral code
```

### 11.5 Push Notifications
```
POST   /api/push/subscribe               -- Subscribe to push
DELETE /api/push/unsubscribe             -- Unsubscribe
POST   /api/push/test                    -- Send test notification
```

### 11.6 Chat
```
GET    /api/chat/:tokenId                -- Get messages (paginated)
POST   /api/chat/:tokenId                -- Send message
DELETE /api/chat/:tokenId/:msgId         -- Delete own message
```

### 11.7 Share Cards
```
GET    /api/share/trade/:tradeId         -- Generate trade card image
GET    /api/share/graduation/:tokenId    -- Generate graduation card
GET    /api/share/referral/:wallet       -- Generate referral card
```

---

## 12. Component Breakdown (React)

### New Components
| Component | Purpose | Location |
|---|---|---|
| `LiveTradeFeed` | Real-time scrolling trade feed | `src/components/LiveTradeFeed.tsx` |
| `InstantTradePanel` | Persistent trade panel | `src/components/InstantTradePanel.tsx` |
| `PriceChart` | Live candlestick chart | `src/components/PriceChart.tsx` |
| `KingOfTheHill` | Featured token hero | `src/components/KingOfTheHill.tsx` |
| `TraderProfile` | Profile page with stats | `src/components/TraderProfile.tsx` |
| `AchievementBadge` | Individual badge display | `src/components/AchievementBadge.tsx` |
| `AchievementGrid` | Badge collection grid | `src/components/AchievementGrid.tsx` |
| `StreakCounter` | Daily streak display | `src/components/StreakCounter.tsx` |
| `QuestCard` | Daily quest card | `src/components/QuestCard.tsx` |
| `ShareTradeCard` | Generated shareable image | `src/components/ShareTradeCard.tsx` |
| `TokenChat` | Chat room per token | `src/components/TokenChat.tsx` |
| `SocialFeed` | Followed traders activity | `src/components/SocialFeed.tsx` |
| `Leaderboard` | Global rankings | `src/components/Leaderboard.tsx` |
| `CreatorDashboard` | Token creator analytics | `src/components/CreatorDashboard.tsx` |
| `GraduationCeremony` | Spectacular celebration | `src/components/GraduationCeremony.tsx` |
| `BottomNav` | Mobile bottom navigation | `src/components/BottomNav.tsx` |
| `SwipeableToken` | Swipe-to-trade wrapper | `src/components/SwipeableToken.tsx` |
| `PushPrompt` | Notification permission UI | `src/components/PushPrompt.tsx` |
| `WhaleAlert` | Big trade notification | `src/components/WhaleAlert.tsx` |

### Enhanced Components
| Component | Enhancement |
|---|---|
| `TokenCard` | Add swipe gestures, live price |
| `TokenModal` | Add chat tab, creator dashboard link |
| `TopNav` | Add streak indicator, push prompt |
| `Home` | Integrate all new components |
| `Account` | Add portfolio tab, achievements tab |

### New Hooks
| Hook | Purpose |
|---|---|
| `useWebSocket` | Real-time connection management |
| `useTradeFeed` | Trade feed data + filtering |
| `usePushNotifications` | Push subscription + handling |
| `useHapticFeedback` | Vibration API wrapper |
| `useGesture` | Swipe detection |

---

## 13. Wireframes (Layout Descriptions)

### 13.1 Home Page (Desktop)
```
┌─────────────────────────────────────────────────────────────────┐
│  HERMES    [King of the Hill: DOGE2 · 4h king]    🔥7d  👤Profile│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐  │
│  │                     │  │  LIVE TRADE FEED                 │  │
│  │  KING OF THE HILL   │  │  ─────────────────────────────   │  │
│  │                     │  │  🔥 Whale bought 5 SOL DOGE2     │  │
│  │  [Token Image]      │  │  📈 EarlyBird bought 0.5 SOL Δ   │  │
│  │  DOGE2              │  │  📉 Trader sold 2 SOL MOON       │  │
│  │  $12,450 mcap       │  │  🔥 Whale bought 10 SOL CAT      │  │
│  │  +45% (1h)          │  │  📈 NewTrader bought 0.1 SOL ▲   │  │
│  │                     │  │  ─────────────────────────────   │  │
│  │  [BUY] [SELL]       │  │  [Filter: All ▾] [🔊] [⚙️]      │  │
│  └─────────────────────┘  └──────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐  │
│  │  LEADERBOARD        │  │  YOUR QUESTS                     │  │
│  │  ─────────────────  │  │  ─────────────────────────────   │  │
│  │  1. WhaleLegend     │  │  ☐ Make 3 trades (1/3) +50XP     │  │
│  │  2. DiamondHands    │  │  ☑ Check in today +25XP          │  │
│  │  3. MoonSeeker      │  │  ☐ Share a trade +30XP           │  │
│  └─────────────────────┘  └──────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 13.2 Home Page (Mobile)
```
┌───────────────────────┐
│  HERMES    🔥7d  👤   │
├───────────────────────┤
│  ┌───────────────────┐│
│  │  KING OF THE HILL ││
│  │  [Token Image]    ││
│  │  DOGE2 · +45%     ││
│  │  [BUY] [SELL]     ││
│  └───────────────────┘│
│                       │
│  ┌───────────────────┐│
│  │  LIVE TRADE FEED  ││
│  │  🔥 Whale +5 SOL  ││
│  │  📈 Early +0.5    ││
│  │  📉 Trader -2     ││
│  │  ───────────────  ││
│  │  [All ▾] [🔊]     ││
│  └───────────────────┘│
│                       │
│  ┌───────────────────┐│
│  │  QUESTS           ││
│  │  ☐ 3 trades (1/3) ││
│  │  ☑ Check in       ││
│  └───────────────────┘│
│                       │
├───────────────────────┤
│  🏠  📈  👤  ⚙️  💬  │
└───────────────────────┘
```

### 13.3 Token Page (Desktop)
```
┌─────────────────────────────────────────────────────────────────┐
│  HERMES                                    🔥7d  👤Profile     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │           │  │  PRICE CHART         │  │  TRADE PANEL     │  │
│  │  Token    │  │  [Candlestick]       │  │  ──────────────  │  │
│  │  Image    │  │  1m 5m 1h 1d         │  │  Balance: 5.2 SOL│  │
│  │           │  │                      │  │  [0.1][0.5][1][5]│  │
│  │  DOGE2    │  │  $12,450            │  │  [BUY NOW]       │  │
│  │  +45%     │  │  +45% (1h)          │  │  [SELL]          │  │
│  │           │  │                      │  │  Slippage: 1%    │  │
│  └───────────┘  └──────────────────────┘  └──────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  CHAT ROOM                                                  ││
│  │  ──────────────────────────────────────────────────────────││
│  │  WhaleLegend: This is going to moon! 🚀                    ││
│  │  DiamondHands: Early buyer here, love the community        ││
│  │  NewTrader: Just bought in! What do you think?             ││
│  │  ──────────────────────────────────────────────────────────││
│  │  [Type a message...]                              [Send]   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 14. Timeline (Detailed Schedule)

### Week 1: Foundation
| Day | Task | Deliverable |
|---|---|---|
| 1 | Setup WebSocket infrastructure | DO class, client hook |
| 2 | Build LiveTradeFeed component | Working feed with mock data |
| 3 | Build InstantTradePanel | Persistent trade panel |
| 4 | Integrate real price data | Live charts |
| 5 | Mobile bottom navigation | BottomNav + FAB |
| 6 | Polish + bug fixes | Week 1 demo |
| 7 | Buffer / catchup | — |

### Week 2: Gamification
| Day | Task | Deliverable |
|---|---|---|
| 8 | Database: profiles, achievements, quests | Migration scripts |
| 9 | TraderProfile component | Profile page |
| 10 | Streak + Quest components | Daily engagement |
| 11 | Achievement system | Badge unlocks + animation |
| 12 | KingOfTheHill 2.0 | Hero component |
| 13 | Leaderboard component | Global rankings |
| 14 | Polish + bug fixes | Week 2 demo |

### Week 3: Social
| Day | Task | Deliverable |
|---|---|---|
| 15 | Database: follows, referrals, chat | Migration scripts |
| 16 | TokenChat component | Real-time chat |
| 17 | SocialFeed component | Followed activity |
| 18 | ShareTradeCard component | Viral sharing |
| 19 | Referral system 2.0 | Multi-tier rewards |
| 20 | Copy-trade feature | One-tap mirror |
| 21 | Polish + bug fixes | Week 3 demo |

### Week 4: Creator + Mobile
| Day | Task | Deliverable |
|---|---|---|
| 22 | Token creation flow 2.0 | Gamified launch |
| 23 | CreatorDashboard | Analytics page |
| 24 | GraduationCeremony 2.0 | Spectacular animation |
| 25 | Push notifications | Price alerts, streaks |
| 26 | Gesture trading | Swipe to trade |
| 27 | Haptic feedback | Vibration API |
| 28 | Polish + bug fixes | Week 4 demo |

### Week 5: Polish + Launch
| Day | Task | Deliverable |
|---|---|---|
| 29 | Motion design pass | GSAP animations |
| 30 | Sound effects | Toggleable audio |
| 31 | Performance optimization | <3s LCP, 60fps |
| 32 | A/B testing setup | Feature flags |
| 33 | Beta testing | 100 users |
| 34 | Bug fixes from feedback | Stable build |
| 35 | LAUNCH 🚀 | Public release |

---

## 15. Budget Estimate

### Infrastructure (Monthly)
| Service | Cost | Notes |
|---|---|---|
| Cloudflare Workers | $5-20 | 10M requests/mo |
| D1 Database | $5-10 | 5GB storage |
| Durable Objects | $10-30 | WebSocket connections |
| R2 Storage | $5 | Token images |
| Cloudflare Pages | $0 | Free tier |
| **Total Infra** | **$25-65/mo** | |

### Development (One-Time)
| Item | Cost | Notes |
|---|---|---|
| Sound effects pack | $50 | One-time purchase |
| Icon pack | $0 | Custom SVG |
| Font licenses | $0 | Google Fonts |
| **Total Dev** | **$50** | |

### Total 5-Month Budget
| Category | Cost |
|---|---|
| Infrastructure (5 mo) | $125-325 |
| Development | $50 |
| **Grand Total** | **$175-375** |

---

## 16. Team & Roles

### Solo Developer (Current)
| Role | Responsibility | Time Allocation |
|---|---|---|
| Frontend Dev | React components, UI, animations | 50% |
| Backend Dev | Workers, D1, WebSocket | 30% |
| Designer | Visual design, motion, UX | 15% |
| DevOps | CI/CD, deployment, monitoring | 5% |

### Recommended Additions (If Budget Allows)
| Role | Responsibility | When to Add |
|---|---|---|
| UI/Frontend Specialist | Complex animations, chart library | Week 2 |
| Backend Engineer | WebSocket scaling, performance | Week 3 |
| Community Manager | Moderation, engagement, feedback | Week 5 |
| QA Tester | E2E tests, cross-browser | Week 4 |

---

## 17. Launch Strategy

### Pre-Launch (Week 4-5)
- [ ] Invite-only beta with 100 traders
- [ ] Seed initial tokens (10-20 quality launches)
- [ ] Set up Discord/Telegram community
- [ ] Prepare launch announcement content
- [ ] Reach out to Solana influencers

### Launch Day
- [ ] Announce on Twitter/X with demo video
- [ ] Activate referral program (double XP for first week)
- [ ] "First 100 traders" badge achievement
- [ ] Live trading competition with prize pool

### Post-Launch (Week 6-8)
- [ ] Daily trading competitions
- [ ] Weekly leaderboard rewards
- [ ] Creator incentives (0% fees for first month)
- [ ] Iterate based on user feedback
- [ ] A/B test key features

---

## 18. A/B Testing Plan

### Tests to Run
| Test | Variant A | Variant B | Metric |
|---|---|---|---|
| Trade panel | Modal | Persistent sidebar | Trades/user/day |
| Streak rewards | Fixed XP | Variable XP | D7 retention |
| Feed sound | On by default | Off by default | Session duration |
| Share card style | Minimal | Detailed | Share rate |
| Quest count | 3/day | 5/day | Quest completion |
| KOTH placement | Top of feed | Center | Click-through rate |

### Testing Framework
- Feature flags via Cloudflare Workers KV
- Track events in D1
- Analyze with simple SQL queries
- Run each test for minimum 1 week
- Statistical significance: p < 0.05

---

*Plan completed: 2026-08-18*
*Total plan sections: 18*
*Plan is ready for review and approval*


---

## 19. Verification Results (2026-08-18)

### Codebase Conflicts Found
| Planned | Existing | Action |
|---|---|---|
| `trader_profiles` | `profiles` (wallet, xp, level, streak_days, last_active_day) | **MIGRATE**: add display_name, avatar_url, rank, total_trades, win_rate, total_pnl, referral_code, referred_by |
| `daily_quests` | `quests` + `quest_progress` | **REUSE**: adapt existing tables |
| `chat_messages` | `comments` (token_id, wallet, text, ts) | **EXTEND**: add reply_to, reactions |
| `leaderboard` | `leaderboard` (rank, name, pnl, trades, win_rate) | **ENHANCE**: add XP, rank, referral tracking |

### New Tables (No Conflicts)
- `achievements` - new
- `follows` - new
- `referrals` - new
- `push_subscriptions` - new

### Components to Enhance (Not Duplicate)
- `KingOfHill.tsx` → KingOfTheHill 2.0
- `TradePanel.tsx` → InstantTradePanel
- `GraduationModal.tsx` → GraduationCeremony 2.0
- `BottomTabBar.tsx` → BottomNav

### No Conflicts
- API routes: all new
- Hooks: all new
- Most components: all new

**Verification complete. Execution can begin.**
