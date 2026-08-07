# Graph Report - hermes-launchpad  (2026-08-07)

## Corpus Check
- 47 files · ~20,059 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 431 nodes · 503 edges · 31 communities (27 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a02bde4c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 22 edges
2. `compilerOptions` - 18 edges
3. `fetch()` - 17 edges
4. `req()` - 11 edges
5. `Hermes Launchpad — Deployment Guide` - 11 edges
6. `Pump.fun-Inspired UI Redesign Plan for Hermes Launchpad` - 11 edges
7. `🛸 Hermes Launchpad` - 8 edges
8. `compilerOptions` - 7 edges
9. `awardXp()` - 7 edges
10. `buildCreateTokenIx()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `cn()` --calls--> `clsx`  [INFERRED]
  src/lib/utils.ts → package.json
- `fetch()` --calls--> `verifyCreateTransaction()`  [EXTRACTED]
  workers/worker.js → workers/chain.js
- `fetch()` --calls--> `verifyTradeTransaction()`  [EXTRACTED]
  workers/worker.js → workers/chain.js
- `Home()` --calls--> `shareLink()`  [EXTRACTED]
  src/pages/Home.tsx → src/lib/identity.ts

## Communities (31 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (51): dependencies, buffer, canvas-confetti, class-variance-authority, cmdk, date-fns, embla-carousel-react, @hookform/resolvers (+43 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (28): Props, checkin(), CheckinResult, CreatedToken, createTokenServer(), fetchComments(), fetchLeaderboard(), fetchProfile() (+20 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (28): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, kimi-plugin-inspect-react (+20 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (25): EMOJIS, Props, anchorString(), ATA_PROGRAM_ID, buildCreateTokenIx(), buildTradeIx(), computeBuyQuote(), computeSellQuote() (+17 more)

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (24): confirmedTransaction(), matchingInstruction(), verifyCreateTransaction(), verifyTradeTransaction(), awardXp(), callAi(), cors, curveProgress() (+16 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (24): compilerOptions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (20): Current Context / Assumptions, Deferred / Truth Constraints, Delivered, Delivery Record — 2026-08-06, Design Philosophy: "Degen-Native Dark", Files Likely to Change, Goal, modern-web-guidance Integration (+12 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (18): context_checkpoint, created_at, goal, instance_id, max_qa_cycles, max_validation_rounds, pause_after_phase, phase (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (16): API worker deploy, Architecture, code:block1 (Browser ──► Cloudflare Pages (hermes-launchpad.pages.dev)   ), code:bash (cd workers), code:bash (cd workers), code:bash (# Prerequisites), code:bash (solana program show 9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6S), Curve parameters (shared by Worker / Frontend / on-chain) (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (15): dependencies, @coral-xyz/anchor, devDependencies, chai, ts-mocha, @types/chai, @types/mocha, typescript (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (15): admin, adminPk, [configPda, configBump], connection, data, dataView, DISC_INIT, feeWalletPk (+7 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (8): Config, CreateToken, Curve, CurveError, Migrated, MigrationReady, Trade, TradeEvent

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (12): computedHash, skillPath, source, sourceType, computedHash, skillPath, source, sourceType (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.20
Nodes (9): Architecture, code:bash (npm install), Curve Parameters (must stay in sync: FE / Worker / on-chain), Deploy, Dev, Features, 🛸 Hermes Launchpad, Live (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.20
Nodes (9): blocked_tasks, completed_tasks, created_at, current_task_index, instance_id, iteration, phase, plan_file (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (9): [configPda], curveAta, [curvePda], mint, program, provider, solIn, tokensIn (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.20
Nodes (3): ErrorBoundary, Props, State

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (8): Build & deploy, code:bash (sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)), code:bash (cd programs/hermes-curve), code:bash (yarn install), Deploying the Bonding Curve to Devnet, One-time setup, Program, Test locally (no deploy needed)

### Community 19 - "Community 19"
Cohesion: 0.25
Nodes (7): compilerOptions, esModuleInterop, lib, module, target, typeRoots, types

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (6): compilerOptions, baseUrl, paths, files, @/*, references

### Community 22 - "Community 22"
Cohesion: 0.50
Nodes (3): created_at, tasks, updated_at

## Knowledge Gaps
- **270 isolated node(s):** `version`, `source`, `sourceType`, `skillPath`, `computedHash` (+265 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 0` to `Community 25`, `Community 2`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `version`, `source`, `sourceType` to the rest of the system?**
  _270 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0392156862745098 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07536231884057971 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._