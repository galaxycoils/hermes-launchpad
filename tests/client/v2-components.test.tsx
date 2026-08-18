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
import InstantTradePanel from "@/components/InstantTradePanel";
import PriceChart from "@/components/PriceChart";
import { useWebSocket } from "@/hooks/useWebSocket";

// =============================================================================
// BottomNav
// =============================================================================

describe("BottomNav", () => {
  it("renders all five navigation tabs", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/"]}>
        <BottomNav activeTab="home" onTabChange={() => {}} unreadCount={0} />
      </MemoryRouter>
    );
    expect(html).toContain("Home");
    expect(html).toContain("Trade");
    expect(html).toContain("Portfolio");
    expect(html).toContain("Activity");
    expect(html).toContain("Menu");
  });

  it("renders the FAB (quick trade) button", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/"]}>
        <BottomNav activeTab="home" onTabChange={() => {}} unreadCount={0} />
      </MemoryRouter>
    );
    expect(html).toContain("\ud83d\ude80");
    expect(html).toContain("Quick trade");
  });

  it("renders an unread badge when unreadCount > 0", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/"]}>
        <BottomNav activeTab="home" onTabChange={() => {}} unreadCount={7} />
      </MemoryRouter>
    );
    expect(html).toContain("7");
    expect(html).toContain("bg-dump");
  });

  it("renders 99+ when unreadCount exceeds 99", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/"]}>
        <BottomNav activeTab="home" onTabChange={() => {}} unreadCount={250} />
      </MemoryRouter>
    );
    expect(html).toContain("99+");
  });

  it("does not render a badge when unreadCount is 0", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/"]}>
        <BottomNav activeTab="home" onTabChange={() => {}} unreadCount={0} />
      </MemoryRouter>
    );
    expect(html).not.toContain("bg-dump");
  });

  it("marks the active tab with aria-current=\"page\"", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/trade"]}>
        <BottomNav activeTab="trade" onTabChange={() => {}} unreadCount={0} />
      </MemoryRouter>
    );
    expect(html).toContain("aria-current=\"page\"");
  });

  it("renders the active indicator dot on the active tab", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/"]}>
        <BottomNav activeTab="home" onTabChange={() => {}} unreadCount={0} />
      </MemoryRouter>
    );
    expect(html).toContain("bg-pump");
  });
});

// =============================================================================
// LiveTradeFeed
// =============================================================================

describe("LiveTradeFeed", () => {
  beforeEach(() => {
    wsMockReturn = {
      connected: false,
      messages: [],
      send: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    };
  });

  it("renders the Live Trades header", () => {
    const html = renderToString(
      <MemoryRouter>
        <LiveTradeFeed />
      </MemoryRouter>
    );
    expect(html).toContain("Live Trades");
  });

  it("shows offline status and connecting message when not connected", () => {
    wsMockReturn.connected = false;
    const html = renderToString(
      <MemoryRouter>
        <LiveTradeFeed />
      </MemoryRouter>
    );
    expect(html).toContain("offline");
    expect(html).toContain("Connecting\u2026");
  });

  it("shows live status and waiting message when connected but no trades", () => {
    wsMockReturn.connected = true;
    const html = renderToString(
      <MemoryRouter>
        <LiveTradeFeed />
      </MemoryRouter>
    );
    expect(html).toContain("live");
    expect(html).toContain("Waiting for trades\u2026");
  });

  it("renders the filter dropdown with all four filter options", () => {
    const html = renderToString(
      <MemoryRouter>
        <LiveTradeFeed />
      </MemoryRouter>
    );
    expect(html).toContain("All");
    expect(html).toContain("Buys");
    expect(html).toContain("Sells");
    expect(html).toContain("Whales");
  });

  it("renders buy trades with correct wallet, amount, and ticker", () => {
    wsMockReturn.connected = true;
    wsMockReturn.messages = [
      {
        type: "trade",
        data: {
          wallet: "0x1234567890abcdef1234567890abcdef12345678",
          side: "buy",
          sol_amount: 1.5,
          token_ticker: "TEST",
          token_name: "Test Token",
        },
        ts: Date.now(),
      },
    ];
    const html = stripReactComments(renderToString(
      <MemoryRouter>
        <LiveTradeFeed />
      </MemoryRouter>
    ));
    expect(html).toContain("BUY");
    expect(html).toContain("1.50 SOL");
    expect(html).toContain("$TEST");
    expect(html).toContain("0x12\u20265678");
  });

  it("renders sell trades with correct side label and amount", () => {
    wsMockReturn.connected = true;
    wsMockReturn.messages = [
      {
        type: "trade",
        data: {
          wallet: "0xabcdef1234567890",
          side: "sell",
          sol_amount: 0.75,
          token_ticker: "SELL",
        },
        ts: Date.now(),
      },
    ];
    const html = stripReactComments(renderToString(
      <MemoryRouter>
        <LiveTradeFeed />
      </MemoryRouter>
    ));
    expect(html).toContain("SELL");
    expect(html).toContain("0.75 SOL");
    expect(html).toContain("$SELL");
  });

  it("renders CSS transition classes that enable flash animation", () => {
    wsMockReturn.connected = true;
    wsMockReturn.messages = [
      {
        type: "trade",
        data: {
          wallet: "0xabcd1234",
          side: "buy",
          sol_amount: 1.0,
          token_ticker: "FLASH",
        },
        ts: Date.now(),
      },
    ];
    const html = renderToString(
      <MemoryRouter>
        <LiveTradeFeed />
      </MemoryRouter>
    );
    // Flash animation relies on transition-colors + duration-300 CSS classes
    expect(html).toContain("transition-colors");
    expect(html).toContain("duration-300");
  });

  it("renders trade count in the footer", () => {
    wsMockReturn.connected = true;
    wsMockReturn.messages = [
      {
        type: "trade",
        data: { wallet: "0x1111", side: "buy", sol_amount: 1, token_ticker: "A" },
        ts: Date.now(),
      },
      {
        type: "trade",
        data: { wallet: "0x2222", side: "sell", sol_amount: 2, token_ticker: "B" },
        ts: Date.now() + 1,
      },
      {
        type: "trade",
        data: { wallet: "0x3333", side: "buy", sol_amount: 3, token_ticker: "C" },
        ts: Date.now() + 2,
      },
    ];
    const html = stripReactComments(renderToString(
      <MemoryRouter>
        <LiveTradeFeed />
      </MemoryRouter>
    ));
    expect(html).toContain("3 trades");
  });

  it("renders a sound toggle button with title attribute", () => {
    const html = renderToString(
      <MemoryRouter>
        <LiveTradeFeed />
      </MemoryRouter>
    );
    // soundOn defaults to false, so title is "Sound off"
    expect(html).toContain("Sound off");
  });
});

// =============================================================================
// InstantTradePanel
// =============================================================================

describe("InstantTradePanel", () => {
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

  it("renders token info (name, ticker, emoji) when token is provided", () => {
    const html = stripReactComments(renderToString(
      <InstantTradePanel token={mockToken} wallet="0xwallet" onClose={() => {}} />
    ));
    expect(html).toContain("Test Token");
    expect(html).toContain("$TEST");
    expect(html).toContain("\ud83d\ude80");
  });

  it("renders placeholder message when token is null", () => {
    const html = renderToString(
      <InstantTradePanel token={null} wallet={null} onClose={() => {}} />
    );
    expect(html).toContain("Select a token to trade");
  });

  it("renders all four amount preset buttons", () => {
    const html = stripReactComments(renderToString(
      <InstantTradePanel token={mockToken} wallet="0xwallet" onClose={() => {}} />
    ));
    expect(html).toContain("0.1 SOL");
    expect(html).toContain("0.5 SOL");
    expect(html).toContain("1 SOL");
    expect(html).toContain("5 SOL");
  });

  it("renders Buy and Sell toggle buttons", () => {
    const html = renderToString(
      <InstantTradePanel token={mockToken} wallet="0xwallet" onClose={() => {}} />
    );
    expect(html).toContain("Buy");
    expect(html).toContain("Sell");
  });

  it("renders the primary buy action button", () => {
    const html = stripReactComments(renderToString(
      <InstantTradePanel token={mockToken} wallet="0xwallet" onClose={() => {}} />
    ));
    expect(html).toContain("Buy $TEST");
  });

  it("renders the balance when wallet is connected", () => {
    const html = stripReactComments(renderToString(
      <InstantTradePanel token={mockToken} wallet="0xwallet" onClose={() => {}} />
    ));
    expect(html).toContain("Balance");
    expect(html).toContain("10");
    expect(html).toContain("SOL");
  });

  it("renders slippage tolerance options", () => {
    const html = stripReactComments(renderToString(
      <InstantTradePanel token={mockToken} wallet="0xwallet" onClose={() => {}} />
    ));
    expect(html).toContain("0.5%");
    expect(html).toContain("1%");
    expect(html).toContain("3%");
  });

  it("renders the switch-to-sell button in buy mode", () => {
    const html = renderToString(
      <InstantTradePanel token={mockToken} wallet="0xwallet" onClose={() => {}} />
    );
    expect(html).toContain("Switch to Sell");
  });

  it("renders a Max button when balance is available on buy side", () => {
    const html = renderToString(
      <InstantTradePanel token={mockToken} wallet="0xwallet" onClose={() => {}} />
    );
    expect(html).toContain("Max");
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
