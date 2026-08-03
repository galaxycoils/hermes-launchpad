import { useState } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { createTokenServer } from '@/lib/api';
import type { Token } from '@/lib/tokens';

const EMOJIS = ['🚀', '🐸', '🦍', '🌙', '⚡', '🔥', '🛸', '💎', '🐕', '🤖', '👑', '🍀'];

interface Props {
  identity: string;
  onClose: () => void;
  onCreated: (t: Token) => void;
}

export default function CreateTokenModal({ identity, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [emoji, setEmoji] = useState('🚀');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const valid = name.trim().length >= 2 && ticker.trim().length >= 2;

  const launch = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setErr('');
    try {
      const res = await createTokenServer({
        name: name.trim(),
        ticker: ticker.trim().toUpperCase().replace(/^\$/, ''),
        emoji,
        wallet: identity,
      });
      const { xpGained, questCompleted, ...token } = res;
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 }, colors: ['#22c55e', '#a855f7', '#eab308'] });
      toast.success(`🚀 $${token.ticker} is LIVE on the curve!`, { description: `+${xpGained ?? 1000} XP for launching` });
      if (questCompleted) toast(`⚡ Quest complete: ${questCompleted.title} (+${questCompleted.xp} XP)`);
      onCreated(token as Token);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Launch failed');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121c] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black">Launch a token <span className="text-green-400">· free</span></h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl">✕</button>
        </div>

        <label className="text-xs text-white/50">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 32))}
          placeholder="e.g. Galactic Gecko"
          className="mt-1 mb-3 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 outline-none focus:border-green-400/50 placeholder:text-white/25"
        />

        <label className="text-xs text-white/50">Ticker</label>
        <div className="mt-1 mb-3 flex items-center rounded-lg bg-white/5 border border-white/10 focus-within:border-green-400/50">
          <span className="pl-4 text-white/40">$</span>
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
            placeholder="GECKO"
            className="flex-1 bg-transparent px-2 py-2.5 outline-none placeholder:text-white/25"
          />
        </div>

        <label className="text-xs text-white/50">Mascot</label>
        <div className="mt-1 mb-4 grid grid-cols-6 gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`text-2xl py-1.5 rounded-lg border ${emoji === e ? 'border-green-400/60 bg-green-500/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-white/50 mb-4">
          <div className="flex justify-between"><span>Curve</span><span className="text-white/80">30 SOL virtual · graduates at 85 SOL raised</span></div>
          <div className="flex justify-between mt-1"><span>Fee</span><span className="text-white/80">0.7% per trade (0.25% goes to you, the creator)</span></div>
          <div className="flex justify-between mt-1"><span>Reward</span><span className="text-yellow-300">+1,000 XP instantly</span></div>
        </div>

        {err && <p className="text-xs text-red-400 mb-3">⚠ {err}</p>}

        <button
          onClick={launch}
          disabled={!valid || busy}
          className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 disabled:bg-white/10 disabled:text-white/30 text-black font-black text-lg"
        >
          {busy ? 'Launching…' : `Launch ${emoji} $${ticker || 'TOKEN'}`}
        </button>
        <p className="text-[11px] text-white/30 text-center mt-3">
          Deployed to the shared devnet curve engine — tradable by everyone instantly.
        </p>
      </div>
    </div>
  );
}
