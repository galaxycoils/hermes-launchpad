import { useCallback, useEffect, useState } from "react";
import { Surface, Panel } from "./Surface";
import { Button } from "./Button";

// ---- types ----

type AlertType = "price_hit" | "whale_buy" | "graduation";
type Direction = "above" | "below";

interface PriceAlert {
  id: string;
  token_id: string;
  wallet: string;
  type: AlertType;
  target_price?: number;
  direction?: Direction;
  push_enabled: boolean;
  created_at: number;
  triggered: boolean;
}

interface AlertsResponse {
  alerts: PriceAlert[];
}

// ---- helpers ----

const ALERT_TYPE_META: Record<AlertType, { label: string; icon: string; description: string }> = {
  price_hit: { label: "Price Target", icon: "\u{1F3AF}", description: "Triggers when price crosses your target" },
  whale_buy: { label: "Whale Buy", icon: "\u{1F40B}", description: "Alerts on large buys (\u22651 SOL)" },
  graduation: { label: "Graduation", icon: "\u{1F393}", description: "Notifies when token reaches Raydium" },
};

const formatPrice = (price: number): string => {
  if (price >= 1) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
};

const formatTime = (ts: number): string => {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

// ---- Toggle ----

interface ToggleProps {
  enabled: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  id?: string;
}

function Toggle({ enabled, onChange, label, id }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none" id={id}>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={() => onChange(!enabled)}
        className={[
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200",
          enabled ? "bg-pump shadow-[0_0_12px_rgba(0,255,102,0.4)]" : "bg-white/10 border border-white/10",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200",
            enabled ? "translate-x-[18px]" : "translate-x-[3px]",
          ].join(" ")}
        />
      </button>
      {label && <span className="text-xs text-white/60">{label}</span>}
    </label>
  );
}

// ---- component ----

export default function PriceAlert({ tokenId, wallet }: { tokenId: string; wallet: string | null }) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [alertType, setAlertType] = useState<AlertType>("price_hit");
  const [direction, setDirection] = useState<Direction>("above");
  const [priceInput, setPriceInput] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Push subscription state
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  // Check push support on mount
  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setPushSupported(supported);
    if (supported && "Notification" in window) {
      setPushSubscribed(Notification.permission === "granted");
    }
  }, []);

  // Fetch alerts for this wallet
  const fetchAlerts = useCallback(async () => {
    if (!wallet) {
      setAlerts([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/alerts/${encodeURIComponent(wallet)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AlertsResponse = await res.json();
      // Filter to current token
      const tokenAlerts = (data.alerts ?? []).filter((a) => a.token_id === tokenId);
      setAlerts(tokenAlerts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [wallet, tokenId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Subscribe to push notifications
  const handlePushSubscribe = useCallback(async () => {
    if (!pushSupported) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: undefined, // Use VAPID key from server config
      });
      // Persist subscription to server
      const res = await fetch("/api/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, subscription: sub.toJSON(), token_id: tokenId }),
      });
      if (res.ok) {
        setPushSubscribed(true);
        setPushEnabled(true);
      }
    } catch {
      // Subscription denied or failed
    }
  }, [pushSupported, wallet, tokenId]);

  // Create a new alert
  const handleCreate = useCallback(async () => {
    if (!wallet) return;
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        token_id: tokenId,
        wallet,
        type: alertType,
        push_enabled: pushEnabled,
      };
      if (alertType === "price_hit") {
        const price = parseFloat(priceInput);
        if (isNaN(price) || price <= 0) {
          setError("Enter a valid target price");
          setSubmitting(false);
          return;
        }
        body.target_price = price;
        body.direction = direction;
      }
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error || `HTTP ${res.status}`);
      }
      setPriceInput("");
      await fetchAlerts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create alert");
    } finally {
      setSubmitting(false);
    }
  }, [wallet, tokenId, alertType, pushEnabled, priceInput, direction, fetchAlerts]);

  // Delete an alert
  const handleDelete = useCallback(async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch {
      setError("Failed to delete alert");
    }
  }, []);

  // Toggle push on an existing alert
  const handleTogglePush = useCallback(async (alertId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ push_enabled: enabled }),
      });
      if (!res.ok) throw new Error();
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, push_enabled: enabled } : a)));
    } catch {
      setError("Failed to update alert");
    }
  }, []);

  if (!wallet) {
    return (
      <Surface className="p-5">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="text-3xl" aria-hidden="true">{'🔔'}</span>
          <p className="text-sm text-white/50">Connect your wallet to set price alerts</p>
        </div>
      </Surface>
    );
  }

  return (
    <Surface className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">{'🔔'}</span>
        <div>
          <h3 className="text-sm font-bold text-white">Price Alerts</h3>
          <p className="text-xs text-white/40">Get notified on price moves & key events</p>
        </div>
      </div>

      {/* Push notification banner */}
      {pushSupported && !pushSubscribed && (
        <Panel className="p-3 flex items-center justify-between gap-3 bg-hermes/5 border-hermes/20">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm shrink-0" aria-hidden="true">{'⚡'}</span>
            <span className="text-xs text-white/60 truncate">Enable push for real-time alerts</span>
          </div>
          <Button size="sm" variant="secondary" onClick={handlePushSubscribe}>
            Enable
          </Button>
        </Panel>
      )}

      {/* Create alert form */}
      <Panel className="p-4 space-y-4">
        {/* Alert type selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Alert Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(ALERT_TYPE_META) as AlertType[]).map((type) => {
              const meta = ALERT_TYPE_META[type];
              const active = alertType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAlertType(type)}
                  className={[
                    "flex flex-col items-center gap-1 rounded-lg border p-2.5 transition-all duration-200",
                    active
                      ? "border-pump/60 bg-pump/10 shadow-[0_0_16px_rgba(0,255,102,0.15)]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
                  ].join(" ")}
                >
                  <span className="text-lg" aria-hidden="true">{meta.icon}</span>
                  <span className={["text-[11px] font-semibold", active ? "text-pump" : "text-white/60"].join(" ")}>
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-white/35">{ALERT_TYPE_META[alertType].description}</p>
        </div>

        {/* Price target input (only for price_hit) */}
        {alertType === "price_hit" && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Target Price</label>
            <div className="flex gap-2">
              {/* Direction toggle */}
              <div className="flex rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDirection("above")}
                  className={[
                    "px-3 py-2 text-xs font-semibold transition-all",
                    direction === "above"
                      ? "bg-pump/15 text-pump"
                      : "text-white/50 hover:text-white/70",
                  ].join(" ")}
                >
                  {'↑'} Above
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("below")}
                  className={[
                    "px-3 py-2 text-xs font-semibold transition-all border-l border-white/10",
                    direction === "below"
                      ? "bg-dump/15 text-dump"
                      : "text-white/50 hover:text-white/70",
                  ].join(" ")}
                >
                  {'↓'} Below
                </button>
              </div>
              {/* Price input */}
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/40">$</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] pl-7 pr-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-pump/50 focus:ring-1 focus:ring-pump/20 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Push toggle */}
        <div className="flex items-center justify-between">
          <Toggle
            enabled={pushEnabled}
            onChange={(val) => {
              if (val && pushSupported && !pushSubscribed) {
                handlePushSubscribe();
              }
              setPushEnabled(val);
            }}
            label="Push notification"
            id="price-alert-push-toggle"
          />
          {!pushSupported && (
            <span className="text-[11px] text-white/30">Push not supported</span>
          )}
        </div>

        {/* Create button */}
        <Button fullWidth variant="primary" onClick={handleCreate} loading={submitting}>
          Create Alert
        </Button>
      </Panel>

      {/* Active alerts list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wide">
            Active Alerts ({alerts.filter((a) => !a.triggered).length})
          </h4>
          {alerts.length > 0 && !loading && (
            <button
              type="button"
              onClick={fetchAlerts}
              className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
            >
              Refresh
            </button>
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 rounded bg-white/5" />
                    <div className="h-2.5 w-32 rounded bg-white/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && alerts.length === 0 && (
          <div className="rounded-lg border border-dashed border-white/10 p-5 text-center">
            <p className="text-xs text-white/35">No alerts yet. Create one above.</p>
          </div>
        )}

        {!loading && alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const meta = ALERT_TYPE_META[alert.type];
              return (
                <Panel
                  key={alert.id}
                  className={[
                    "p-3 flex items-center justify-between gap-3 transition-all",
                    alert.triggered ? "opacity-50" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.05] border border-white/10">
                      <span className="text-base" aria-hidden="true">{meta.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{meta.label}</span>
                        {alert.triggered && (
                          <span className="text-[10px] font-semibold text-gold bg-gold/10 px-1.5 py-0.5 rounded">
                            Triggered
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/40 truncate">
                        {alert.type === "price_hit" && alert.target_price !== undefined
                          ? `${alert.direction === "above" ? "↑" : "↓"} ${formatPrice(alert.target_price)}`
                          : `Created ${formatTime(alert.created_at)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Toggle
                      enabled={alert.push_enabled}
                      onChange={(val) => handleTogglePush(alert.id, val)}
                      id={`alert-push-${alert.id}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleDelete(alert.id)}
                      aria-label="Delete alert"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:text-dump hover:bg-dump/10 transition-all"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </Panel>
              );
            })}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-dump/30 bg-dump/10 p-3 text-xs text-dump">
            {error}
          </div>
        )}
      </div>
    </Surface>
  );
}
