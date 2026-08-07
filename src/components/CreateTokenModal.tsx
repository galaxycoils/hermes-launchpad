import { useState } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Keypair, Transaction } from '@solana/web3.js';
import { getProvider, buildCreateTokenIx, sendTx } from '@/lib/solana';
import { registerToken, type Token } from '@/lib/api';

const EMOJIS = ['🚀', '🐸', '🦍', '🌙', '⚡', '🔥', '🛸', '💎', '🐕', '🤖', '👑', '🍀'];
type Props = { onClose: () => void; onCreated: (token: Token) => void };

export default function CreateTokenModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [emoji, setEmoji] = useState('🚀');
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const valid = name.trim().length >= 2 && ticker.trim().length >= 2;

  const launch = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    try {
      const provider = getProvider();
      if (!provider) throw new Error('Install Phantom or Solflare');
      await provider.connect();

      const mint = Keypair.generate();
      const uri = '';
      const ix = buildCreateTokenIx(provider.publicKey, mint.publicKey, name.trim(), ticker.trim().toUpperCase().replace(/^\$/, ''), uri);
      const tx = new Transaction().add(ix);
      tx.partialSign(mint);
      const sig = await sendTx(provider, tx);

      const result = await registerToken({
        mint: mint.publicKey.toBase58(),
        name: name.trim(),
        ticker: ticker.trim().toUpperCase().replace(/^\$/, ''),
        emoji,
        creator: provider.publicKey.toBase58(),
        signature: sig,
      });

      const { xpGained, questCompleted, ...token } = result;
      confetti({ particleCount: 180, spread: 90, origin: { y: .65 }, colors: ['#00ff66', '#a855f7', '#ffd60a'] });
      toast.success("$" + token.ticker + " is live", { description: "+" + (xpGained ?? 1000) + " XP" });
      if (questCompleted) toast("Quest complete: " + questCompleted.title + " (+" + questCompleted.xp + " XP)");
      onCreated(token as Token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Launch failed. Try again.');
      setBusy(false);
    }
  };

  const renderStep1 = () => {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="token-name" className="text-xs font-bold text-white/65">Token name</label>
          <input id="token-name" name="token-name" autoComplete="off" value={name} onChange={(event) => setName(event.target.value.slice(0, 32))} placeholder="Galactic Gecko..." className="mt-1 w-full rounded-md border border-[#2a2a2a] bg-black px-3 py-2.5 placeholder:text-white/25" />
        </div>
        <div>
          <label htmlFor="token-ticker" className="text-xs font-bold text-white/65">Ticker</label>
          <div className="mt-1 flex rounded-md border border-[#2a2a2a] bg-black focus-within:border-pump">
            <span className="px-3 py-2.5 text-white/45">$</span>
            <input id="token-ticker" name="token-ticker" autoComplete="off" spellCheck={false} value={ticker} onChange={(event) => setTicker(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))} placeholder="GECKO" className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 placeholder:text-white/25" />
          </div>
        </div>
        <button onClick={() => valid && setStep(2)} disabled={!valid} className="w-full rounded-md bg-pump py-3 font-black text-black disabled:opacity-30">Choose Mascot</button>
      </div>
    );
  };

  const getEmojiButtonClass = (item: string) => {
    const base = 'rounded-md border py-2 text-2xl ';
    return base + (emoji === item ? 'border-pump bg-pump/10' : 'border-[#2a2a2a] bg-black hover:border-white/50');
  };

  const renderStep2 = () => {
    return (
      <div>
        <p className="mb-3 text-sm text-white/65">Pick a mascot. Curve terms are fixed & shown before launch.</p>
        <div className="grid grid-cols-6 gap-2">
          {EMOJIS.map((item) => (
            <button key={item} onClick={() => setEmoji(item)} aria-label={"Choose " + item} className={getEmojiButtonClass(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={() => setStep(1)} className="flex-1 rounded-md border border-[#2a2a2a] py-3 font-bold">Back</button>
          <button onClick={() => setStep(3)} className="flex-1 rounded-md bg-pump py-3 font-black text-black">Review</button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-[#2a2a2a] bg-black p-4">
          <p className="text-4xl">{emoji}</p>
          <p className="mt-2 text-lg font-black">{name} <span className="font-mono text-sm text-white/55">$</span>{ticker}</p>
          <dl className="mt-4 space-y-2 text-xs text-white/65">
            <div className="flex justify-between"><dt>Curve</dt><dd>30 SOL virtual · 85 SOL graduation</dd></div>
            <div className="flex justify-between"><dt>Fees</dt><dd>0.7% per trade</dd></div>
            <div className="flex justify-between"><dt>Reward</dt><dd className="text-pump">+1,000 XP</dd></div>
          </dl>
        </div>
        {error && <p className="text-sm text-dump" aria-live="polite">{error}</p>}
        <div className="flex gap-2">
          <button onClick={() => setStep(2)} disabled={busy} className="flex-1 rounded-md border border-[#2a2a2a] py-3 font-bold">Back</button>
          <button onClick={launch} disabled={busy} className="flex-1 rounded-md bg-pump py-3 font-black text-black disabled:opacity-50">{busy ? 'Launching...' : "Launch $" + ticker}</button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="launch-title" className="w-full max-w-md overscroll-contain rounded-t-xl border border-[#2a2a2a] bg-[#111] p-5 sm:rounded-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-pump">Step {step} / 3</p>
            <h2 id="launch-title" className="text-xl font-black">Launch Token</h2>
          </div>
          <button onClick={onClose} aria-label="Close launch token dialog" className="text-xl text-white/60 hover:text-white">×</button>
        </div>
        <div className="mb-5 h-1 overflow-hidden rounded bg-white/10">
          <div className="h-full bg-pump transition-[width]" style={{ width: step / 3 * 100 + "%" }} />
        </div>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}
