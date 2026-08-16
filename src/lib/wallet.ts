// Minimal wallet provider shim — handles desktop (injected provider) and mobile (deep links)
import { useEffect, useRef, useState } from 'react';

export interface SolanaProvider {
  isPhantom?: boolean;
  connect(): Promise<{ publicKey: { toBase58(): string; toString(): string } }>;
  disconnect(): Promise<void>;
  signMessage?(message: Uint8Array): Promise<{ signature: Uint8Array }>;
}

export function getProvider(): SolanaProvider | null {
  const w = window as unknown as { solana?: SolanaProvider };
  return w.solana ?? null;
}

export const isMobile = (): boolean =>
  typeof navigator !== 'undefined' &&
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function openPhantomDeepLink(): void {
  const url = encodeURIComponent(window.location.href);
  window.location.href = `https://phantom.app/ul/browse/${url}`;
}

function openSolflareDeepLink(): void {
  const url = encodeURIComponent(window.location.href);
  window.location.href = `https://solflare.com/ul/browse/${url}`;
}

export type WalletChoice = 'phantom' | 'solflare';

export async function connectWallet(
  setWallet: (k: string | null) => void,
  choice?: WalletChoice,
): Promise<void> {
  const provider = getProvider();

  if (provider) {
    try {
      const res = await provider.connect();
      setWallet(res.publicKey.toBase58());
    } catch {
      // user canceled
    }
    return;
  }

  if (isMobile()) {
    if (choice === 'solflare') {
      openSolflareDeepLink();
    } else {
      openPhantomDeepLink();
    }
    return;
  }

  window.open('https://phantom.com/', '_blank');
}

/**
 * Hook: poll for injected provider on mount (handles mobile deep-link return).
 */
export function useWalletProvider() {
  const [connecting, setConnecting] = useState(false);
  const initialProvider = getProvider();
  const [providerDetected, setProviderDetected] = useState<boolean>(!!initialProvider);
  const connectingRef = useRef(false);

  useEffect(() => {
    if (initialProvider) return;

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', '?'));
    const returnedFromWallet = params.get('wallet') === 'return';

    if (!returnedFromWallet && !isMobile()) return;

    let cancelled = false;
    const startPolling = () => {
      if (cancelled) return;
      connectingRef.current = true;
      setConnecting(true);

      let attempts = 0;
      const maxAttempts = 20;
      const interval = setInterval(() => {
        attempts++;
        if (getProvider()) {
          clearInterval(interval);
          connectingRef.current = false;
          setConnecting(false);
          setProviderDetected(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          connectingRef.current = false;
          setConnecting(false);
        }
      }, 250);
    };

    requestAnimationFrame(startPolling);

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    setConnecting(false);
    setProviderDetected(false);
    let attempts = 0;
    const maxAttempts = 20;
    const interval = setInterval(() => {
      attempts++;
      if (getProvider()) {
        clearInterval(interval);
        connectingRef.current = false;
        setConnecting(false);
        setProviderDetected(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        connectingRef.current = false;
        setConnecting(false);
      }
    }, 250);
  };

  return { provider: getProvider(), connecting, providerDetected, retry };
}
