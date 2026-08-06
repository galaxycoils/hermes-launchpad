import { useEffect, useState } from 'react';

const key = 'hermes-tour-seen';
export default function OnboardingTour() {
  const [open, setOpen] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setOpen(localStorage.getItem(key) !== '1')); return () => window.clearTimeout(timer); }, []);
  const close = () => { localStorage.setItem(key, '1'); setOpen(false); };
  if (!open) return null;
  return <aside className="fixed bottom-20 left-3 z-50 max-w-xs rounded-lg border border-hermes/60 bg-[#111] p-4 shadow-2xl sm:bottom-5"><button className="absolute right-2 top-1 text-lg text-white/50" aria-label="Dismiss tour" onClick={close}>×</button><p className="font-mono text-xs text-pump">HOW IT WORKS</p><h2 className="mt-1 font-black">Curve first. Research optional.</h2><ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-5 text-white/65"><li>Open a token to trade its shared curve.</li><li>Use AI Research for Bard lore and Oracle risk context.</li><li>Graduation moves liquidity to Raydium.</li></ol><button onClick={close} className="mt-3 rounded-md bg-pump px-3 py-2 text-xs font-black text-black">Got it</button></aside>;
}
