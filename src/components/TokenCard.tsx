import type { Token } from '@/lib/tokens';
import { tokenCurveStatus } from '@/lib/token-truth';

export default function TokenCard({ token, onSelect }: { token: Token; onSelect: (t: Token) => void }) {
  const status = tokenCurveStatus(token);
  return (
    <button
      onClick={() => onSelect(token)}
      className="group surface content-visibility-auto w-full rounded-lg border p-3 text-left transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-[#00ff66]/70 hover:bg-[#161616] active:translate-y-0"
    >
      <div className="flex min-w-0 flex items-center gap-2">
        <span className="text-3xl" aria-hidden="true">{token.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'bg-pump' : 'bg-yellow-300'}`}
              aria-label={status === 'active' ? 'Confirmed on-chain curve' : status === 'demo' ? 'Demo record' : 'Migration ready'}
            />
            <span className="truncate font-bold">{token.name}</span>
            <span className="font-mono text-xs text-white/55">${token.ticker}</span>
            {status === 'demo' && (
              <span className="rounded border border-yellow-400/30 bg-yellow-400/20 px-1.5 py-0.5 font-mono text-[10px] text-yellow-300">Demo</span>
            )}
            {status === 'active' && (
              <span className="rounded border border-green-400/30 bg-green-400/10 px-1.5 py-0.5 font-mono text-[10px] text-green-300">Confirmed on-chain curve</span>
            )}
            {status === 'migration-ready' && (
              <span className="rounded border border-yellow-400/30 bg-yellow-400/20 px-1.5 py-0.5 font-mono text-[10px] text-yellow-300">Migration ready</span>
            )}
          </div>
          <div className="truncate text-[11px] text-white/45">
            {token.creator ? `by ${token.creator.slice(0, 6)}…${token.creator.slice(-4)}` : 'unknown creator'}
            {token.onchainMint && ' · on-chain'}
          </div>
        </div>
      </div>
      {status !== 'demo' && token.realSol !== undefined && (
        <div className="mt-3 text-xs text-white/50">
          {token.realSol.toFixed(1)} SOL raised
        </div>
      )}
    </button>
  );
}