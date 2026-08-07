# Capability States (r2)

> Exact copy per plan §6A. Every exposed control must render one of these states with evidence.

| State | Display copy | Condition |
|---|---|---|
| `verified-live` | "Live · verified on-chain at slot {slot} ({verified_at_utc})" | Fresh `verified_at` timestamp + known slot from Worker decode |
| `confirmed-indexing` | "Indexing confirmed · signature {sig} pending finalization" | Signature confirmed, not yet finalized |
| `stale` | "Stale · last verified {verified_at_utc}, >{threshold}s ago — reconnecting" | Freshness threshold exceeded |
| `degraded` | "Degraded · {reason} (RPC/Worker) — trading disabled" | RPC or Worker health degraded |
| `fixture/demo` | "Demo data · not live" | Test/demo only, visually distinct, never in production read path |
| `planned` | "Planned · not yet available" | Future feature, not yet implemented |
| `unavailable` | "Unavailable · {reason}" | Feature flag off / wallet absent / AI disabled / RPC down |

**Rule:** No control may render `verified-live` without a fresh `verified_at` timestamp and known slot. Fixtures must never masquerade as live data.
