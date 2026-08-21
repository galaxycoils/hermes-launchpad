import { useEffect } from 'react'
import { FocusTrap } from 'focus-trap-react'
import TradeModalContent from '@/components/TradeModalContent'
import type { Token, CommentItem } from '@/lib/tokens'
import type { TradeResult } from '@/lib/api'

interface TokenModalProps {
  token: Token
  onClose: () => void
  onLike: (id: string) => void
  liked: boolean
  comments: CommentItem[]
  onComment: (text: string) => void
  wallet: string | null
  refCode?: string
  onTradeComplete?: (result: TradeResult) => void
}

export default function TokenModal({
  token,
  onClose,
  onLike,
  liked,
  comments,
  onComment,
  wallet,
  refCode,
  onTradeComplete,
}: TokenModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <FocusTrap focusTrapOptions={{ initialFocus: false, allowOutsideClick: true }}>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4 overflow-y-auto"
        onClick={onClose}
        role="presentation"
        data-testid="token-modal"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${token.name} Trade Modal`}
          className="w-full max-w-lg overscroll-contain rounded-t-2xl border border-white/10 bg-obsidian p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl sm:p-6 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Capability-state status indicators */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {token.onchainMint ? (
              <span className="rounded bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 text-[10px] font-mono text-green-300">
                Live · verified on-chain at slot {token.onchainMint.slice(-8)}
              </span>
            ) : (
              <span className="rounded bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 text-[10px] font-mono text-yellow-300">
                Unavailable · feature planned
              </span>
            )}
            <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] font-mono text-white/50">
              Unavailable · AI disabled
            </span>
          </div>

          <TradeModalContent
            token={token}
            wallet={wallet}
            liked={liked}
            onLike={onLike}
            comments={comments}
            onComment={onComment}
            refCode={refCode}
            onTradeComplete={onTradeComplete}
            onClose={onClose}
          />
        </div>
      </div>
    </FocusTrap>
  )
}
