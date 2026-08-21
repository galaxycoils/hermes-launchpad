import React, { useState } from 'react'
import { toast } from 'sonner'
import PriceChart from '@/components/PriceChart'
import OracleSignal from '@/components/OracleSignal'
import TradeExecutionPanel from '@/components/TradeExecutionPanel'
import OracleRing from '@/components/OracleRing'
import { formatUnixAge, migrationProgress } from '@/lib/token-truth'
import type { Token, CommentItem } from '@/lib/tokens'
import type { TradeResult } from '@/lib/api'

interface TradeModalContentProps {
  token: Token
  wallet: string | null
  liked?: boolean
  onLike?: (id: string) => void
  comments?: CommentItem[]
  onComment?: (text: string) => void
  refCode?: string
  onTradeComplete?: (result: TradeResult) => void
  onClose: () => void
}

type TabOption = 'lore' | 'chat' | 'info'

export default function TradeModalContent({
  token,
  wallet,
  liked = false,
  onLike,
  comments = [],
  onComment,
  onTradeComplete,
  onClose,
}: TradeModalContentProps) {
  const [activeTab, setActiveTab] = useState<TabOption>('lore')
  const [newComment, setNewComment] = useState('')

  const progress = migrationProgress(token)
  const isPositive = (token.change24h ?? 0) >= 0

  const handlePostComment = () => {
    const text = newComment.trim()
    if (!text) return
    onComment?.(text)
    setNewComment('')
    toast.success('Comment posted')
  }

  return (
    <div className="flex flex-col w-full text-left" data-testid="trade-modal-content">
      {/* Pinned Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <OracleRing score={token.riskScore} isDemo={!token.onchainMint} size="md">
            <span className="text-2xl select-none">{token.emoji}</span>
          </OracleRing>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 truncate">
              <h2 className="font-display font-black text-lg text-white truncate">{token.name}</h2>
              <span className="font-mono text-xs text-white/50">${token.ticker}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-white/40">
              <span>{token.realSol?.toFixed(1) ?? '0.0'} SOL</span>
              <span>·</span>
              <span className="text-pulse">{progress.toFixed(0)}% to Raydium</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onLike && (
            <button
              type="button"
              onClick={() => onLike(token.id)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm hover:border-white/20 transition-colors"
              aria-label="Like token"
            >
              {liked ? '❤️' : '🤍'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm text-white/60 hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Pinned Price Chart */}
      <div className="mb-4 rounded-xl border border-white/10 bg-black/40 overflow-hidden">
        <PriceChart tokenId={token.id} tokenName={token.name} tokenTicker={token.ticker} />
      </div>

      {/* Pinned Oracle Risk Signal */}
      <div className="mb-4">
        <OracleSignal score={token.riskScore} riskFlag={token.riskFlag} />
      </div>

      {/* Pinned Trade Execution Panel */}
      <div className="mb-5">
        <TradeExecutionPanel token={token} wallet={wallet} onTradeComplete={onTradeComplete} />
      </div>

      {/* Supplementary Content Tabs */}
      <div className="border-t border-white/[0.06] pt-4">
        <div className="mb-3 flex items-center gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'lore'}
            onClick={() => setActiveTab('lore')}
            className={`rounded-lg px-3 py-1.5 text-xs font-display font-bold transition-all ${
              activeTab === 'lore'
                ? 'bg-iris/20 text-iris-start border border-iris/40'
                : 'text-white/40 hover:text-white'
            }`}
          >
            📜 The Bard Lore
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
            className={`rounded-lg px-3 py-1.5 text-xs font-display font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-iris/20 text-iris-start border border-iris/40'
                : 'text-white/40 hover:text-white'
            }`}
          >
            💬 Chat ({comments.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'info'}
            onClick={() => setActiveTab('info')}
            className={`rounded-lg px-3 py-1.5 text-xs font-display font-bold transition-all ${
              activeTab === 'info'
                ? 'bg-iris/20 text-iris-start border border-iris/40'
                : 'text-white/40 hover:text-white'
            }`}
          >
            ℹ️ Token Details
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'lore' && (
          <div className="rounded-xl border border-iris/20 bg-iris/[0.04] p-4">
            <p className="font-lore italic text-base leading-relaxed text-white/80">
              "{token.lore || 'From the digital ether, the token emerges — awaiting the prophetic verses of The Bard.'}"
            </p>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="space-y-3">
            {wallet && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                  placeholder="Share market alpha..."
                  className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-iris"
                />
                <button
                  type="button"
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                  className="rounded-xl bg-iris px-3.5 py-2 text-xs font-bold text-white hover:bg-iris/90 disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            )}
            {comments.length === 0 ? (
              <p className="py-4 text-center text-xs text-white/30">No comments yet. Start the conversation!</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {comments.map((c) => (
                  <li key={c.ts} className="rounded-lg bg-white/[0.02] border border-white/5 p-2.5 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
                      <span className="font-mono">{c.wallet.slice(0, 4)}…{c.wallet.slice(-4)}</span>
                      <span>{formatUnixAge(Math.floor(c.ts / 1000))}</span>
                    </div>
                    <p className="text-white/80">{c.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2.5">
              <span className="text-white/40 block text-[10px]">CREATOR</span>
              <span className="text-white truncate block">{token.creator || 'Anonymous'}</span>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2.5">
              <span className="text-white/40 block text-[10px]">CHAIN</span>
              <span className="text-pulse font-bold">Solana Devnet</span>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2.5">
              <span className="text-white/40 block text-[10px]">MINT STATUS</span>
              <span className="text-white">{token.onchainMint ? 'On-chain Indexed' : 'Demo Mode'}</span>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2.5">
              <span className="text-white/40 block text-[10px]">MIGRATION TARGET</span>
              <span className="text-sol font-bold">85.0 SOL</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
