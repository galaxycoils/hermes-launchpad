import { useState } from 'react';
import { Keypair, Transaction, PublicKey } from '@solana/web3.js';
import { buildCreateTokenIx, connection, getProvider } from '@/lib/solana';

export default function CreateTokenModal({ wallet, onClose }: { wallet: PublicKey | null; onClose: () => void }) {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [sig, setSig] = useState('');
  const [err, setErr] = useState('');

  const launch = async () => {
    const provider = getProvider();
    if (!provider || !wallet) return;
    setBusyState('working');
    try {
      const mint = Keypair.generate();
      const ix = buildCreateTokenIx(wallet, mint.publicKey, name.trim(), symbol.trim().toUpperCase(), 'https://hermes-launchpad.pages.dev/metadata.json');
      const tx = new Transaction().add(ix);
      tx.feePayer = wallet;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.partialSign(mint);
      // Provider signs as fee payer; mint already partially signed.
      const signed = await provider.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature, 'confirmed');
      setSig(signature);
      setBusyState('done');
    } catch (e) {
      setErr(e instanceof Error ? e.message.slice(0, 200) : String(e));
      setBusyState('error');
    }
    function setBusyState(s: typeof status) { setStatus(s); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold">🚀 Launch a token</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-2xl leading-none">×</button>
        </div>

        {status === 'done' ? (
          <div className="mt-4 text-center">
            <div className="text-5xl mb-3">🛸</div>
            <p className="text-green-400 font-bold">Token created on devnet!</p>
            <a className="text-xs text-purple-300 underline break-all" href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`} target="_blank" rel="noreferrer">
              View on Solana Explorer
            </a>
          </div>
        ) : !wallet ? (
          <p className="mt-4 text-white/60 text-sm">Connect a wallet (Phantom) with devnet SOL to launch for real. Devnet SOL is free from the faucet.</p>
        ) : (
          <>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={32} placeholder="Token name (e.g. Moon Cat)"
              className="mt-4 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-green-400/50" />
            <input value={symbol} onChange={(e) => setSymbol(e.target.value)} maxLength={10} placeholder="Symbol (e.g. MCAT)"
              className="mt-2 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-green-400/50" />
            <button
              onClick={launch}
              disabled={status === 'working' || !name.trim() || !symbol.trim()}
              className="mt-4 w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold disabled:opacity-40"
            >
              {status === 'working' ? 'Launching on devnet…' : 'Launch on devnet (1B supply → bonding curve)'}
            </button>
            {status === 'error' && <p className="mt-2 text-xs text-red-400 break-all">{err}</p>}
            <p className="mt-2 text-[11px] text-white/40">Real on-chain transaction via program <span className="font-mono">E99nGQh6…u93U</span>. Creator earns 0.25% on every trade, forever.</p>
          </>
        )}
      </div>
    </div>
  );
}
