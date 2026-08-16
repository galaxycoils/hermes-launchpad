"use client";
import gsap from "gsap";
import { useGsapContext } from "@/hooks/useGsapContext";

export default function Hero({ onCreate, onRefCopy }: { onCreate: () => void; onRefCopy: () => void }) {
  useGsapContext(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(".hero-title", { clearProps: "all" });
    });
    mm.add("(min-width: 768px)", () => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(".hero-eyebrow", { opacity: 0, y: 20, duration: 0.5 })
        .from(".hero-title", { opacity: 0, y: 40, duration: 0.8 }, "-=0.3")
        .from(".hero-title-accent", { opacity: 0, scale: 0.8, duration: 0.4, transformOrigin: "left center" }, "-=0.4")
        .from(".hero-subtitle", { opacity: 0, y: 20, duration: 0.5 }, "-=0.3")
        .from(".hero-cta", { opacity: 0, y: 20, stagger: 0.1, duration: 0.4 }, "-=0.2")
        .from(".hero-status", { opacity: 0, scale: 0.8, duration: 0.3 }, "-=0.1")
        .from(".hero-orb-1", { opacity: 0, scale: 0.5, duration: 1 }, 0)
        .from(".hero-orb-2", { opacity: 0, scale: 0.5, duration: 1 }, 0.3);
    });
    return () => mm.revert();
  }, []);

  return (
    <header className="relative overflow-hidden border-b border-white/10">
      {/* Ambient orbs */}
      <div className="hero-orb-1 absolute top-[10%] left-[5%] h-72 w-72 rounded-full bg-hermes/20 blur-[80px] animate-float" />
      <div className="hero-orb-2 absolute top-[20%] right-[10%] h-96 w-96 rounded-full bg-pump/10 blur-[100px] animate-float" style={{ animationDelay: "300ms" }} />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
        {/* Eyebrow */}
        <div className="hero-eyebrow font-mono text-xs uppercase tracking-[0.2em] text-pump">
          AI-Native Fair Launches on Solana
        </div>

        {/* Headline */}
        <h1 className="hero-title mt-3 max-w-3xl text-balance text-5xl font-black tracking-[-0.06em] sm:text-7xl leading-[0.95]">
          Bonding curves
          <br />
          <span className="hero-title-accent text-pump">
            you can verify on-chain.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle mt-4 max-w-xl text-pretty text-sm leading-6 text-white/60 sm:text-base">
          Lore and risk from agents — not influencers. Default curve threshold: 85 SOL.
          Locked curves become migration-ready.
        </p>

        {/* CTAs */}
        <div className="hero-cta mt-7 flex flex-wrap gap-2">
          <button
            onClick={onCreate}
            className="rounded-lg bg-pump px-6 py-3 font-black text-black transition-all hover:bg-pump/90 hover:shadow-[0_0_30px_rgba(0,255,102,0.3)] active:scale-[0.97]"
          >
            Launch Token
          </button>
          <button
            onClick={onRefCopy}
            className="rounded-lg border border-hermes/40 bg-hermes/10 px-6 py-3 font-bold text-purple-200 transition-all hover:bg-hermes/20 hover:border-hermes/60 active:scale-[0.97]"
          >
            Copy Referral Link
          </button>
        </div>
      </div>

      {/* Status pill */}
      <div className="hero-status absolute right-4 top-4 sm:top-6 sm:right-auto sm:ml-auto sm:flex sm:items-center rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-xs font-mono font-semibold text-green-300">
        ● INDEX API REACHABLE
      </div>
    </header>
  );
}
