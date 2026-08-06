import { useState } from 'react';
import { getProvider } from '@/lib/wallet';

export default function WalletButton({ wallet, setWallet }: { wallet: string | null; setWallet: (k: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const connect = async () => { const provider = getProvider(); if (!provider) { window.open('https://phantom.com/', '_blank'); return; } setBusy(true); try { const res = await provider.connect(); setWallet(res.publicKey.toBase58()); } catch { /* User cancelled. */ } setBusy(false); };
  const disconnect = async () => { try { await getProvider()?.disconnect(); } catch { /* Provider already disconnected. */ } setWallet(null); };
  if (wallet) return <button onClick={disconnect} className="rounded-md border border-[#00ff66]/50 bg-[#00ff66]/10 px-3 py-2 font-mono text-xs text-pump">{wallet.slice(0, 4)}…{wallet.slice(-4)} ×</button>;
  return <button onClick={connect} disabled={busy} className="rounded-md bg-hermes px-3 py-2 text-sm font-black text-white transition-[background-color,transform] hover:bg-purple-400 active:scale-[.98] disabled:opacity-50">{busy ? 'Connecting…' : 'Connect Wallet'}</button>;
}
