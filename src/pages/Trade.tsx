import React, { useState, useEffect } from 'react'
import TokenCard from '@/components/TokenCard'
import TokenModal from '@/components/TokenModal'
import FilterBar from '@/components/FilterBar'
import { fetchTokens } from '@/lib/api'
import { filterVerifiedTokens } from '@/lib/token-truth'
import type { Token, CommentItem } from '@/lib/tokens'
import type { VerifiedTokenFilter } from '@/lib/token-truth'

export default function Trade() {
  const [filter, setFilter] = useState<VerifiedTokenFilter>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Token | null>(null)
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTokens()
      .then(({ data }) => {
        setTokens(data)
        setLoading(false)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load tokens')
        setLoading(false)
      })
  }, [])

  const filteredTokens = filterVerifiedTokens(
    tokens.filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.ticker.toLowerCase().includes(search.toLowerCase())
    ),
    filter
  )

  return (
    <div className="min-h-screen bg-void text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-void/90 backdrop-blur-xl px-4 py-3 sm:px-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 max-w-7xl mx-auto">
          <h1 className="text-xl font-display font-black">Trade Terminal</h1>
          <FilterBar
            filter={filter}
            onFilterChange={setFilter}
            search={search}
            onSearchChange={setSearch}
          />
        </div>
      </header>

      {/* Token Grid */}
      <main className="pb-24 px-4 pt-4 sm:px-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-obsidian/40 p-4 animate-pulse">
                <div className="h-20 w-full rounded-lg bg-white/5 mb-3" />
                <div className="h-4 w-3/4 rounded bg-white/5 mb-2" />
                <div className="h-3 w-1/2 rounded bg-white/5" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-bleed font-bold">Failed to load tokens</p>
            <p className="text-white/50 mt-2 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-pulse px-4 py-2 text-sm font-bold text-void"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredTokens.map((token) => (
              <TokenCard key={token.id} token={token} onSelect={setSelected} />
            ))}
          </div>
        )}
      </main>

      {/* Selected Token Modal */}
      {selected && (
        <TokenModal
          token={selected}
          onClose={() => setSelected(null)}
          onLike={() => {}}
          liked={false}
          comments={selected.comments || []}
          onComment={() => {}}
          wallet={null}
          onTradeComplete={() => setSelected(null)}
        />
      )}
    </div>
  )
}