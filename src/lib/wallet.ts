// Minimal wallet provider shim — no web3.js needed for the shared-curve phase.
// Identity is just the base58 address string; the server-side curve engine
// does the accounting. On-chain signing returns with the Anchor program.
export interface SolanaProvider {
  isPhantom?: boolean;
  connect(): Promise<{ publicKey: { toBase58(): string; toString(): string } }>;
  disconnect(): Promise<void>;
}

export function getProvider(): SolanaProvider | null {
  const w = window as unknown as { solana?: SolanaProvider };
  return w.solana ?? null;
}
