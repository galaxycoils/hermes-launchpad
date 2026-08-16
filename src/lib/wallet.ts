// Minimal wallet provider shim — handles desktop (injected provider) and mobile (deep links)
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

/** Open Phantom via universal link so the in-app browser can inject window.solana. */
function openPhantomDeepLink(): void {
  const url = encodeURIComponent(window.location.href);
  window.location.href = `https://phantom.app/ul/browse/${url}`;
}

/** Open Solflare via universal link. */
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
    // Desktop: injected provider (Phantom/Solflare extension)
    try {
      const res = await provider.connect();
      setWallet(res.publicKey.toBase58());
    } catch {
      // user canceled
    }
    return;
  }

  // Mobile: no injected provider — deep link into wallet app
  if (isMobile()) {
    if (choice === 'solflare') {
      openSolflareDeepLink();
    } else {
      openPhantomDeepLink();
    }
    return;
  }

  // Desktop without provider: open Phantom download page
  window.open('https://phantom.com/', '_blank');
}
