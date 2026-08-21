import type { VerifiedTokenFilter } from '@/lib/token-truth'

export type FilterOption = VerifiedTokenFilter

interface FilterBarProps {
  filter: FilterOption
  onFilterChange: (filter: FilterOption) => void
  search: string
  onSearchChange: (search: string) => void
  className?: string
}

export default function FilterBar({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  className = '',
}: FilterBarProps) {
  const filterPills: { id: FilterOption; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'curve-progress', label: 'Curve' },
    { id: 'migration-ready', label: 'Ready' },
  ]

  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 ${className}`}>
      {/* Search Input */}
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/30 text-xs">
          🔍
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, ticker, or contract…"
          aria-label="Search tokens"
          className="h-10 w-full rounded-xl border border-white/10 bg-obsidian/70 pl-8 pr-8 text-xs text-white placeholder:text-white/30 backdrop-blur-md transition-colors focus:border-iris focus:outline-none focus:ring-1 focus:ring-iris/50"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-white/40 hover:text-white text-xs"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" role="tablist">
        {filterPills.map((pill) => {
          const isActive = filter === pill.id
          return (
            <button
              key={pill.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(pill.id)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'border border-iris bg-iris/15 text-white shadow-[0_0_12px_rgba(124,106,255,0.25)]'
                  : 'border border-white/5 bg-obsidian/50 text-white/50 hover:border-white/15 hover:text-white'
              }`}
            >
              {pill.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
