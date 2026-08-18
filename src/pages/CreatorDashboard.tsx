import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import CreatorDashboard from "@/components/CreatorDashboard";
import PriceAlert from "@/components/PriceAlert";
import { fetchToken } from "@/lib/api";
import type { Token } from "@/lib/tokens";
import { Surface } from "@/components/Surface";
import { Button } from "@/components/Button";

export default function CreatorDashboardPage() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const navigate = useNavigate();
  const [token, setToken] = useState<Token | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!tokenId) {
        navigate("/");
        return;
      }
      try {
        const t = await fetchToken(tokenId);
        setToken(t);
        // Try to get wallet from localStorage
        const stored = localStorage.getItem("wallet");
        if (stored) {
          setWallet(stored);
        }
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [tokenId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-pump/30 border-t-pump rounded-full animate-spin mx-auto" />
          <p className="text-white/60">Loading creator dashboard...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-white/60">Token not found</p>
          <Button variant="primary" onClick={() => navigate("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-16 pb-20">
      <Surface className="mx-auto max-w-5xl px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{token.emoji}</span>
            <div>
              <h1 className="text-xl font-black">
                {token.name} <span className="font-mono text-sm text-white/55">${token.ticker}</span>
              </h1>
              <p className="text-xs text-white/45">Creator Dashboard</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => navigate("/")}>← Back</Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
          <button
            className="flex-1 rounded-md py-2 text-sm font-semibold text-white/80 hover:text-white"
          >
            Analytics
          </button>
          <button
            className="flex-1 rounded-md py-2 text-sm font-semibold text-white/50 hover:text-white"
          >
            Alerts
          </button>
          <button
            className="flex-1 rounded-md py-2 text-sm font-semibold text-white/50 hover:text-white"
          >
            Chat
          </button>
        </div>

        {/* Content */}
        {wallet ? (
          <>
            <CreatorDashboard tokenId={tokenId!} wallet={wallet} />
            <PriceAlert tokenId={tokenId!} wallet={wallet} />
          </>
        ) : (
          <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center">
            <p className="text-white/60 mb-4">Connect your wallet to access creator tools</p>
            <Button variant="primary" onClick={() => navigate("/account")}>Connect Wallet</Button>
          </div>
        )}
      </Surface>
    </div>
  );
}
