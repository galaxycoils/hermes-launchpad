import { useState } from 'react';
import { connectWallet } from '@/lib/wallet';

export default function WalletButton({ wallet, setWallet }: { wallet: string | null; setWallet: (k: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const handleConnect = async () => {
    setBusy(true);
    try {
      await connectWallet(setWallet);
    } catch { /* ignore */ }
    setBusy(false);
  };
  const disconnect = async () => {
    setBusy(true);
    try {
      const { getProvider } = await import('@/lib/wallet');
      await getProvider()?.disconnect();
    } catch { /* ignore */ }
    setWallet(null);
    setBusy(false);
  };
  if (wallet) return (
    <button onClick={disconnect} className="rounded-md border border-[#00ff66]/50 bg-[#00ff66]/10 px-3 py-2 font-mono text-xs text-pump">{wallet.slice(0, 4)}…{wallet.slice(-4)} ×</button>
  );
  return (
    <button onClick={handleConnect} disabled={busy} className="rounded-md bg-hermes px-3 py-2 text-sm font-black text-white transition-[background-color,transform] hover:bg-purple-400 active:scale-[.98] disabled:opacity-50">
      {busy ? 'Connecting…' : 'Connect Wallet'}
    </button>
  );
}
