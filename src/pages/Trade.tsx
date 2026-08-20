import { useState, useEffect } from 'react';
import TokenCard from '@/components/TokenCard';
import TradePanel from '@/components/TradePanel';
import { fetchTokens } from '@/lib/api';
import { filterVerifiedTokens } from '@/lib/token-truth';
import type { Token } from '@/lib/tokens';
import type { VerifiedTokenFilter } from '@/lib/token-truth';

function isDevnet(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.includes('workers') || host.includes('dev') || host.includes('localhost') || host.includes('pages.dev');
}

export default function Trade() {
  const [filter, setFilter] = useState<VerifiedTokenFilter>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Token | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const devnet = isDevnet();

  // Load tokens on mount
  useEffect(() => {
    fetchTokens()
      .then(({ data }) => {
        setTokens(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load tokens');
        setLoading(false);
      });
  }, []);

  const handleTokenClick = (token: Token) => {
    setSelected(token);
  };

  const filteredTokens = filterVerifiedTokens(
    tokens.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.ticker.toLowerCase().includes(search.toLowerCase())
    ),
    filter
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Devnet preview banner */}
      {devnet && (
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-center text-xs font-bold text-yellow-300 mx-4 mt-2">
          Devnet preview — not mainnet. Use a Devnet wallet and faucet SOL.
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black">Trade</h1>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as VerifiedTokenFilter)}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm font-mono text-white placeholder:text-white/20 outline-none focus:border-pump"
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="demo">Demo</option>
            </select>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tokens..."
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm font-mono text-white placeholder:text-white/20 outline-none focus:border-pump w-48"
            />
          </div>
        </div>
      </header>

      {/* Token Grid */}
      <main className="pb-24 px-4 pt-4 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 animate-pulse">
                <div className="h-24 w-full rounded-lg bg-white/5 mb-3" />
                <div className="h-4 w-3/4 rounded bg-white/5 mb-2" />
                <div className="h-3 w-1/2 rounded bg-white/5" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 font-bold">Failed to load tokens</p>
            <p className="text-white/50 mt-2 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded bg-pump px-4 py-2 text-sm font-bold text-black"
            >
              Retry
            </button>
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/50 font-bold text-lg">No tokens found</p>
            <p className="text-white/30 mt-2">Try adjusting your filters or search</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTokens.map((token) => (
              <TokenCard
                key={token.id}
                token={token}
                onSelect={handleTokenClick}
              />
            ))}
          </div>
        )}
      </main>

      {/* Selected Token Trade Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-lg overscroll-contain rounded-t-xl border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5 sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <TradePanel
              token={selected}
              wallet={null}
              onTradeComplete={() => setSelected(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}