import { useState } from 'react';
import { getProvider } from '@/lib/solana';
import type { PublicKey } from '@solana/web3.js';

export default function WalletButton({ wallet, setWallet }: { wallet: PublicKey | null; setWallet: (k: PublicKey | null) => void }) {
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    const provider = getProvider();
    if (!provider) {
      window.open('https://phantom.com/', '_blank');
      return;
    }
    setBusy(true);
    try {
      const res = await provider.connect();
      setWallet(res.publicKey);
    } catch { /* user rejected */ }
    setBusy(false);
  };

  const disconnect = async () => {
    const provider = getProvider();
    try { await provider?.disconnect(); } catch { /* noop */ }
    setWallet(null);
  };

  if (wallet) {
    const short = `${wallet.toBase58().slice(0, 4)}…${wallet.toBase58().slice(-4)}`;
    return (
      <button onClick={disconnect} className="px-4 py-1.5 rounded-lg bg-green-500/20 border border-green-400/40 text-green-300 text-sm font-semibold hover:bg-green-500/30">
        {short} ✕
      </button>
    );
  }
  return (
    <button onClick={connect} disabled={busy} className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold disabled:opacity-50">
      {busy ? 'Connecting…' : 'Connect Wallet'}
    </button>
  );
}
