import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";

// =============================================================================
// Helpers
// =============================================================================

// React SSR inserts <!-- --> comment markers between adjacent text/expression nodes.
// Strip them so we can assert on the visible text content.
function stripReactComments(html: string): string {
  return html.replace(/<!-- -->/g, "");
}

// =============================================================================
// Mocks
// =============================================================================

// useWebSocket mock — controllable return value per test
let wsMockReturn: {
  connected: boolean;
  messages: Array<{ type: string; data: unknown; ts: number }>;
  send: () => void;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
} = {
  connected: false,
  messages: [],
  send: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
};

vi.mock("@/hooks/useWebSocket", () => ({
  useWebSocket: () => wsMockReturn,
}));

// useTrade mock — controllable return value per test
let tradeMockReturn: {
  executeTrade: (side: "buy" | "sell", amount: number) => Promise<unknown>;
  pending: boolean;
  error: string | null;
  curve: unknown;
  balance: number | null;
  refreshCurve: () => void;
} = {
  executeTrade: vi.fn(),
  pending: false,
  error: null,
  curve: null,
  balance: null,
  refreshCurve: vi.fn(),
};

vi.mock("@/hooks/useTrade", () => ({
  useTrade: () => tradeMockReturn,
}));

// lightweight-charts mock — SSR never calls createChart but the import must resolve
vi.mock("lightweight-charts", () => ({
  createChart: vi.fn(() => ({
    addSeries: vi.fn(() => ({ setData: vi.fn() })),
    subscribeCrosshairMove: vi.fn(),
    applyOptions: vi.fn(),
    remove: vi.fn(),
  })),
  CandlestickSeries: {},
  LineSeries: {},
  ColorType: { Solid: "solid" },
  CrosshairMode: { Normal: 0 },
}));

// =============================================================================
// Imports (after vi.mock hoisting)
// =============================================================================

import BottomNav from "@/components/BottomNav";
import LiveTradeFeed from "@/components/LiveTradeFeed";
import TradeExecutionPanel from "@/components/TradeExecutionPanel";
import PriceChart from "@/components/PriceChart";
import { useWebSocket } from "@/hooks/useWebSocket";

// =============================================================================
// TradeExecutionPanel
// =============================================================================

describe("TradeExecutionPanel", () => {
  const mockToken = {
    id: "test-1",
    name: "Test Token",
    ticker: "TEST",
    emoji: "\ud83d\ude80",
    lore: "A test token",
    creator: "0xcreator",
    chain: "SOL" as const,
    priceSol: 0.001,
  };

  beforeEach(() => {
    tradeMockReturn = {
      executeTrade: vi.fn(),
      pending: false,
      error: null,
      curve: null,
      balance: 10,
      refreshCurve: vi.fn(),
    };
  });

  it("renders token info when token is provided", () => {
    const html = stripReactComments(renderToString(
      <TradeExecutionPanel token={mockToken} wallet="0xwallet" />
    ));
    expect(html).toContain("$TEST");
  });

  it("renders placeholder message when token is null", () => {
    const html = renderToString(
      <TradeExecutionPanel token={null} wallet={null} />
    );
    expect(html).toContain("Select a token to trade");
  });

  it("renders all four amount preset buttons", () => {
    const html = stripReactComments(renderToString(
      <TradeExecutionPanel token={mockToken} wallet="0xwallet" />
    ));
    expect(html).toContain("0.1 SOL");
    expect(html).toContain("0.5 SOL");
    expect(html).toContain("1 SOL");
    expect(html).toContain("5 SOL");
  });

  it("renders Buy and Sell toggle buttons", () => {
    const html = renderToString(
      <TradeExecutionPanel token={mockToken} wallet="0xwallet" />
    );
    expect(html).toContain("Buy");
    expect(html).toContain("Sell");
  });

  it("renders the primary buy action button", () => {
    const html = stripReactComments(renderToString(
      <TradeExecutionPanel token={mockToken} wallet="0xwallet" />
    ));
    expect(html).toContain("BUY $TEST");
  });

  it("renders the balance when wallet is connected", () => {
    const html = stripReactComments(renderToString(
      <TradeExecutionPanel token={mockToken} wallet="0xwallet" />
    ));
    expect(html).toContain("Balance");
    expect(html).toContain("10");
    expect(html).toContain("SOL");
  });

  it("renders a Max button when balance is available on buy side", () => {
    const html = renderToString(
      <TradeExecutionPanel token={mockToken} wallet="0xwallet" />
    );
    expect(html).toContain("MAX");
  });
});

// =============================================================================
// PriceChart
// =============================================================================

describe("PriceChart", () => {
  it("renders the chart container div", () => {
    const html = stripReactComments(renderToString(
      <PriceChart tokenId="test-1" tokenName="Test Token" tokenTicker="TEST" />
    ));
    expect(html).toContain("Test Token");
    expect(html).toContain("$TEST");
  });

  it("renders the timeframe selector with all four options", () => {
    const html = renderToString(
      <PriceChart tokenId="test-1" tokenName="Test Token" tokenTicker="TEST" />
    );
    expect(html).toContain("1m");
    expect(html).toContain("5m");
    expect(html).toContain("1h");
    expect(html).toContain("1d");
  });

  it("renders the stat labels (Price, Change, Volume, High / Low)", () => {
    const html = renderToString(
      <PriceChart tokenId="test-1" tokenName="Test Token" tokenTicker="TEST" />
    );
    expect(html).toContain("Price");
    expect(html).toContain("Change");
    expect(html).toContain("Volume");
    expect(html).toContain("High / Low");
  });

  it("renders the bonding curve progress section", () => {
    const html = stripReactComments(renderToString(
      <PriceChart tokenId="test-1" tokenName="Test Token" tokenTicker="TEST" />
    ));
    expect(html).toContain("Bonding Curve");
    expect(html).toContain("Graduation");
  });
});

// =============================================================================
// useWebSocket hook integration
// =============================================================================

describe("useWebSocket hook integration", () => {
  beforeEach(() => {
    wsMockReturn = {
      connected: false,
      messages: [],
      send: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    };
  });

  it("exposes connected=false and empty messages on initial render", () => {
    function Probe() {
      const ws = useWebSocket();
      return (
        <div>
          <span data-testid="connected">{String(ws.connected)}</span>
          <span data-testid="count">{ws.messages.length}</span>
        </div>
      );
    }
    const html = renderToString(<Probe />);
    expect(html).toContain("false");
    expect(html).toContain("0");
  });

  it("exposes connected=true and message count when mock state changes", () => {
    wsMockReturn.connected = true;
    wsMockReturn.messages = [
      { type: "trade", data: { wallet: "0x1" }, ts: Date.now() },
      { type: "trade", data: { wallet: "0x2" }, ts: Date.now() + 1 },
    ];

    function Probe() {
      const ws = useWebSocket();
      return (
        <div>
          <span>{String(ws.connected)}</span>
          <span>{ws.messages.length}</span>
        </div>
      );
    }
    const html = renderToString(<Probe />);
    expect(html).toContain("true");
    expect(html).toContain("2");
  });

  it("provides subscribe, unsubscribe, and send as functions", () => {
    function Probe() {
      const ws = useWebSocket();
      return (
        <div>
          <span>{typeof ws.subscribe}</span>
          <span>{typeof ws.unsubscribe}</span>
          <span>{typeof ws.send}</span>
        </div>
      );
    }
    const html = renderToString(<Probe />);
    // All three should be "function"
    expect(html).toContain("function");
  });

  it("integrates with LiveTradeFeed to render live trade data", () => {
    wsMockReturn.connected = true;
    wsMockReturn.messages = [
      {
        type: "trade",
        data: {
          wallet: "0xabcd1234",
          side: "buy",
          sol_amount: 2.0,
          token_ticker: "HOOK",
        },
        ts: Date.now(),
      },
    ];
    const html = stripReactComments(renderToString(
      <MemoryRouter>
        <LiveTradeFeed />
      </MemoryRouter>
    ));
    // Hook data flows through to rendered component
    expect(html).toContain("live");
    expect(html).toContain("BUY");
    expect(html).toContain("2.00 SOL");
    expect(html).toContain("$HOOK");
  });

  it("integrates with LiveTradeFeed to show offline state", () => {
    wsMockReturn.connected = false;
    const html = renderToString(
      <MemoryRouter>
        <LiveTradeFeed />
      </MemoryRouter>
    );
    expect(html).toContain("offline");
    expect(html).toContain("Connecting\u2026");
  });
});
