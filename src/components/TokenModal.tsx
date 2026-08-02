import { useState } from 'react';
import { fmtUsd, MIGRATION_TARGET } from '@/lib/tokens';
import type { Token } from '@/lib/tokens';
import Sparkline from './Sparkline';

export default function TokenModal({ token, onClose }: { token: Token; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const est = amount ? (parseFloat(amount) / token.price).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#12121a] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{token.emoji}</span>
            <div>
              <h2 className="text-xl font-bold text-white">{token.name} <span className="text-white/50 text-sm">${token.ticker}</span></h2>
              <div className="text-xs text-white/50">{token.chain} · created by {token.creator}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-white/40">Price</div>
              <div className="text-lg font-bold text-white">${token.price.toFixed(6)}</div>
            </div>
            <Sparkline data={token.spark} positive={token.change24h >= 0} w={200} h={56} />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3 text-center text-sm">
            <div><div className="text-[10px] text-white/40">MCAP</div><div className="font-semibold text-white">{fmtUsd(token.marketCap)}</div></div>
            <div><div className="text-[10px] text-white/40">VOL 24H</div><div className="font-semibold text-white">{fmtUsd(token.volume24h)}</div></div>
            <div><div className="text-[10px] text-white/40">HOLDERS</div><div className="font-semibold text-white">{token.holders.toLocaleString()}</div></div>
            <div><div className="text-[10px] text-white/40">AI RISK</div><div className={`font-semibold ${token.riskScore < 40 ? 'text-green-400' : token.riskScore < 65 ? 'text-yellow-400' : 'text-red-400'}`}>{token.riskScore}/100</div></div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-purple-500/10 border border-purple-400/20 p-4">
          <div className="text-xs font-semibold text-purple-300 mb-1">🤖 AI Narrative Agent — "The Bard"</div>
          <p className="text-sm text-white/80 italic">"{token.lore}"</p>
          <p className="mt-2 text-[10px] text-white/40">Not financial advice. DYOR. Demo content.</p>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>Migration progress</span>
            <span>{fmtUsd(token.marketCap)} / {fmtUsd(MIGRATION_TARGET)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 via-green-400 to-emerald-300" style={{ width: `${token.curveProgress}%` }} />
          </div>
          <p className="text-[11px] text-white/40 mt-1">At {fmtUsd(MIGRATION_TARGET)} market cap, liquidity auto-migrates to Raydium and LP is burned forever.</p>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {(['buy', 'sell'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-2 rounded-lg font-bold capitalize ${tab === t ? (t === 'buy' ? 'bg-green-500 text-black' : 'bg-red-500 text-white') : 'bg-white/10 text-white/60'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {[0.1, 0.5, 1, 5].map((v) => (
              <button key={v} onClick={() => setAmount(String(v))} className="flex-1 text-xs py-1.5 rounded bg-white/10 text-white/70 hover:bg-white/20">{v} SOL</button>
            ))}
          </div>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="Amount in SOL"
            className="mt-2 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-green-400/50"
          />
          <div className="flex justify-between text-xs text-white/50 mt-2">
            <span>You receive ≈ {est} {token.ticker}</span>
            <span>Fees: 0.7% · Max slippage 5%</span>
          </div>
          <button className={`mt-3 w-full py-3 rounded-xl font-bold text-lg ${tab === 'buy' ? 'bg-green-500 hover:bg-green-400 text-black' : 'bg-red-500 hover:bg-red-400 text-white'}`}>
            {tab === 'buy' ? `Buy ${token.ticker}` : `Sell ${token.ticker}`} (demo)
          </button>
          <p className="text-center text-[10px] text-white/30 mt-2">Demo UI — connect wallet & contracts come with the real backend.</p>
        </div>
      </div>
    </div>
  );
}
