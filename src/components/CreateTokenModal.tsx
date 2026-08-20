import { useState, useEffect } from 'react';
import { FocusTrap } from 'focus-trap-react';
import { Button } from '@/components/Button';
import Badge from '@/components/Badge';
import { Surface } from '@/components/Surface';
import { confettiBurst, xpFlyIn } from '@/components/ConfettiBurst';
import { toast } from 'sonner';
import { Keypair, Transaction } from '@solana/web3.js';
import { indexToken } from '@/lib/api';
import { getProvider, buildCreateTokenIx, sendTx } from '@/lib/solana';
import { MIGRATION_TARGET, type Token } from '@/lib/tokens';

const EMOJIS = ['🚀', '🐸', '🦍', '🌙', '⚡', '🔥', '🛸', '💎', '🐕', '🤖', '👑', '🍀'];

interface Props {
  onClose: () => void;
  onCreated: (token: Token) => void;
}

export default function CreateTokenModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [emoji, setEmoji] = useState('🚀');
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const valid = name.trim().length >= 2 && ticker.trim().length >= 2;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, busy]);

  const launch = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    try {
      const provider = getProvider();
      if (!provider) throw new Error('Install Phantom or Solflare');
      await provider.connect();
      console.log('[CreateTokenModal] Provider connected');

      const mint = Keypair.generate();
      const uri = '';
      const ix = buildCreateTokenIx(
        provider.publicKey,
        mint.publicKey,
        name.trim(),
        ticker.trim().toUpperCase().replace(/^\$/, ''),
        uri,
      );
      const tx = new Transaction().add(ix);
      console.log('[CreateTokenModal] Sending transaction...');
      const sigResult = await sendTx(provider, tx, { extraSigner: mint });
      const sig = sigResult.signature;
      const slot = sigResult.slot;
      const creator = provider.publicKey.toBase58();
      console.log('[CreateTokenModal] Transaction sent, calling indexToken...', { sig, slot, creator, mint: mint.publicKey.toBase58() });
      const indexed = await indexToken({
        name: name.trim(),
        ticker: ticker.trim().toUpperCase().replace(/^\$/, ''),
        emoji,
        creator,
        mint: mint.publicKey.toBase58(),
        signature: sig,
        slot,
        timestamp: Math.floor(Date.now() / 1000),
      }).catch((e) => {
        console.error('[CreateTokenModal] indexToken failed:', e);
        return null;
      });

      const token: Token = {
        id: indexed?.id ?? ticker.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) + '-' + sig.slice(0, 4),
        name: name.trim(),
        ticker: ticker.trim().toUpperCase().replace(/^\$/, ''),
        emoji,
        lore: 'Fresh off the curve. Lore pending The Bard.',
        creator,
        chain: 'SOL',
        onchainMint: mint.publicKey.toBase58(),
        provenance: indexed?.provenance,
        realSol: indexed?.realSol,
        complete: indexed?.complete ?? false,
      };

      console.log('[CreateTokenModal] Token created:', token);
      confettiBurst('create');
      toast.success('$' + token.ticker + ' is live', { description: 'On-chain launch confirmed' });
      setTimeout(() => xpFlyIn(), 150);
      onCreated(token);
    } catch (cause) {
      console.error('[CreateTokenModal] Launch error:', cause);
      setError(cause instanceof Error ? cause.message : 'Launch failed. Try again.');
      setBusy(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="ct-name" className="text-xs font-bold text-white/65">Token name</label>
        <input
          id="ct-name"
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 32))}
          placeholder="Galactic Gecko..."
          className="mt-1 w-full rounded-md border bg-surface px-3 py-2.5 text-white placeholder:text-white/25 outline-none transition-colors focus:border-pump"
        />
      </div>
      <div>
        <label htmlFor="ct-ticker" className="text-xs font-bold text-white/65">Ticker</label>
        <div className="mt-1 flex rounded-md bg-surface focus-within:border-pump transition-colors">
          <span className="px-3 py-2.5 text-white/45">$</span>
          <input
            id="ct-ticker"
            autoComplete="off"
            spellCheck={false}
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
            placeholder="GECKO"
            className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 text-white placeholder:text-white/25 outline-none"
          />
        </div>
      </div>
      <Button variant="primary" size="lg" fullWidth onClick={() => valid && setStep(2)} disabled={!valid}>
        Choose Mascot
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <p className="mb-3 text-sm text-white/65">Pick a mascot. Curve terms are fixed & shown before launch.</p>
      <div className="grid grid-cols-6 gap-2">
        {EMOJIS.map((item) => (
          <button
            key={item}
            onClick={() => setEmoji(item)}
            aria-label={`Choose ${item}`}
            className={`rounded-md border py-2 text-2xl transition-colors ${
              emoji === item ? 'border-pump bg-pump/10' : 'border-white/10 bg-surface hover:border-white/30'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <Button variant="secondary" size="lg" fullWidth onClick={() => setStep(1)}>
          Back
        </Button>
        <Button variant="primary" size="lg" fullWidth onClick={() => setStep(3)}>
          Review
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <Surface className="rounded-lg p-4">
        <p className="text-4xl">{emoji}</p>
        <p className="mt-2 text-lg font-black">
          {name} <span className="font-mono text-sm text-white/55">${ticker}</span>
        </p>
        <dl className="mt-4 space-y-2 text-xs text-white/65">
          <div className="flex justify-between">
            <dt>Curve</dt>
            <dd>30 SOL virtual · {MIGRATION_TARGET} SOL default threshold</dd>
          </div>
          <div className="flex justify-between">
            <dt>Fees</dt>
            <dd>0.5% per trade</dd>
          </div>
          <div className="flex justify-between">
            <dt>Indexing</dt>
            <dd>Pending independent verification</dd>
          </div>
        </dl>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-white/40">
          <Badge variant="onchain" label="devnet" />
          <Badge variant="active" label="live curve" />
        </div>
        </Surface>

      {error && <p className="text-sm text-dump" aria-live="polite">{error}</p>}

      <div className="flex gap-2">
        <Button variant="secondary" size="lg" fullWidth onClick={() => setStep(2)} disabled={busy}>
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={busy}
          disabled={busy}
          onClick={launch}
        >
          {busy ? 'Launching...' : '$ ' + ticker}
        </Button>
      </div>
    </div>
  );

  return (
    <FocusTrap focusTrapOptions={{ initialFocus: false, allowOutsideClick: true }}>
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ct-title"
        className="w-full max-w-md overscroll-contain rounded-t-xl border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-pump">Step {step} / 3</p>
            <h2 id="ct-title" className="text-xl font-black">Launch Token</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close launch token dialog"
            className="text-xl text-white/60 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="mb-5 h-1 overflow-hidden rounded bg-white/10">
          <div
            className="h-full bg-pump transition-[width]"
            style={{ width: (step / 3) * 100 + '%' }}
          />
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
    </FocusTrap>
  );
}
