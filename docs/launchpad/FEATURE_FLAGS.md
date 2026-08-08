# Feature Flags (r2)

> Exact copy per plan §6B. Defaults fail-closed in deployed envs.

| Key | Default | Enabled | Disabled | Verification |
|---|---|---|---|---|
| CHAIN_INDEXING_REQUIRED | true | Worker must verify/index before UI shows trade | trade UI disabled/degraded | source scan: no postTrade/createTokenServer in route graph |
| REALTIME_ENABLED | false | DO WebSocket fan-out (post-core) | verified REST polling + stale/reconnecting labels | reconnect/stale UI test |
| AI_ENABLED | false | Bard/Oracle advisory with provenance | AI controls hidden, unavailable copy | AI contract test (disabled returns unavailable) |
| SOCIAL_WRITES_ENABLED | false | wallet-signed comments/likes/referrals | read-only; write controls hidden | anon-write test fails closed |
| MIGRATION_ENABLED | false | Raydium CPMM graduation after proof | MigrationReady state only | negative migration test |
| LEGACY_MIGRATION_SWEEP | false | (deprecated) old sweep if explicitly enabled | legacy migrate returns LegacyMigrationDisabled | negative test: authority cannot sweep |
| FIXTURES_ENABLED | false | (test/demo only) fixture data | no fixture in production read path | CI fails if true outside test config |

**Startup validation:** rejects unknown/missing keys. CI fails if deployed defaults drift or FIXTURES_ENABLED true outside test-only config.
