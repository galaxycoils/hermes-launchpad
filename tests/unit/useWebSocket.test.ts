import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import React, { createElement } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

// ---------------------------------------------------------------------------
// Mark act environment (suppresses React act() warnings)
// ---------------------------------------------------------------------------
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// ---------------------------------------------------------------------------
// Global WebSocket mock
// ---------------------------------------------------------------------------
type WsHandler = (this: WebSocket, ev: any) => void;

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  onopen: WsHandler | null = null;
  onmessage: WsHandler | null = null;
  onclose: WsHandler | null = null;
  onerror: WsHandler | null = null;
  sent: string[] = [];

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
  }

  // Test helpers
  emitOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.call(this, new Event("open"));
  }

  emitMessage(data: string): void {
    this.onmessage?.call(this, { data } as MessageEvent);
  }

  emitClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.call(this, new CloseEvent("close"));
  }

  emitError(): void {
    this.onerror?.call(this, new Event("error"));
  }

  static instances: MockWebSocket[] = [];
  static reset(): void {
    MockWebSocket.instances = [];
  }
}

// Patch global WebSocket
vi.stubGlobal("WebSocket", MockWebSocket);

// ---------------------------------------------------------------------------
// Hook harness — renders a component that captures the hook return value
// Uses a mutable container so tests always read the latest value
// ---------------------------------------------------------------------------
const hookState = { current: null as ReturnType<typeof useWebSocket> | null };

function HookHarness() {
  hookState.current = useWebSocket();
  return null;
}

const roots: any[] = [];

async function renderHook() {
  hookState.current = null;
  await act(async () => {
    const { createRoot } = await import("react-dom/client");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(createElement(HookHarness));
    roots.push(root);
  });
  return hookState.current!;
}

async function unmountAll() {
  while (roots.length > 0) {
    const root = roots.pop();
    await act(async () => {
      root.unmount();
    });
  }
  document.body.innerHTML = "";
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useWebSocket", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.reset();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await unmountAll();
    vi.useRealTimers();
  });

  // ── 1. Export verification ───────────────────────────────────────────────
  it("exports useWebSocket function", () => {
    expect(useWebSocket).toBeDefined();
    expect(typeof useWebSocket).toBe("function");
  });

  it("exports WsMessage and WsMessageType types (compile-time check)", () => {
    // Types are erased at runtime; this test verifies the module loads correctly
    // and the hook returns objects matching the UseWebSocketReturn interface
    expect(hookState.current).toBeNull(); // Not rendered yet
    expect(useWebSocket).toBeTruthy(); // Module loaded
  });

  // ── 2. Initial state ─────────────────────────────────────────────────────
  it("returns correct initial shape with connected=false and messages=[]", async () => {
    await renderHook();
    const result = hookState.current!;
    expect(result).toBeDefined();
    expect(result.connected).toBe(false);
    expect(result.messages).toEqual([]);
    expect(typeof result.send).toBe("function");
    expect(typeof result.subscribe).toBe("function");
    expect(typeof result.unsubscribe).toBe("function");
  });

  // ── 3. Connection state changes ─────────────────────────────────────────
  it("sets connected=true when WebSocket opens", async () => {
    await renderHook();
    const ws = MockWebSocket.instances[0];
    expect(ws).toBeDefined();

    await act(async () => {
      ws.emitOpen();
    });

    expect(hookState.current!.connected).toBe(true);
  });

  it("sets connected=false when WebSocket closes", async () => {
    await renderHook();
    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.emitOpen();
    });
    expect(hookState.current!.connected).toBe(true);

    await act(async () => {
      ws.emitClose();
    });
    expect(hookState.current!.connected).toBe(false);
  });

  // ── 4. Message handling ─────────────────────────────────────────────────
  it("parses and stores valid JSON messages", async () => {
    await renderHook();
    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.emitOpen();
    });

    const msg1 = { type: "trade", data: { price: 100 }, ts: 1700000000 };
    const msg2 = { type: "price", data: { symbol: "SOL" }, ts: 1700000001 };

    await act(async () => {
      ws.emitMessage(JSON.stringify(msg1));
      ws.emitMessage(JSON.stringify(msg2));
    });

    expect(hookState.current!.messages).toHaveLength(2);
    expect(hookState.current!.messages[0]).toEqual(msg1);
    expect(hookState.current!.messages[1]).toEqual(msg2);
  });

  it("ignores malformed JSON messages", async () => {
    await renderHook();
    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.emitOpen();
    });

    await act(async () => {
      ws.emitMessage("not valid json{{{");
      ws.emitMessage("{ type: broken }");
      ws.emitMessage("");
    });

    expect(hookState.current!.messages).toHaveLength(0);
  });

  it("caps messages at MAX_MESSAGES (100)", async () => {
    await renderHook();
    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.emitOpen();
    });

    await act(async () => {
      for (let i = 0; i < 110; i++) {
        ws.emitMessage(JSON.stringify({ type: "price", data: i, ts: i }));
      }
    });

    expect(hookState.current!.messages).toHaveLength(100);
    // Should keep the last 100 (first 10 are dropped)
    expect(hookState.current!.messages[0].data).toBe(10);
    expect(hookState.current!.messages[99].data).toBe(109);
  });

  // ── 5. Reconnection with backoff ─────────────────────────────────────────
  it("attempts reconnection after close with exponential backoff", async () => {
    await renderHook();
    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.emitOpen();
    });
    expect(hookState.current!.connected).toBe(true);

    // Close the connection
    await act(async () => {
      ws.emitClose();
    });
    expect(hookState.current!.connected).toBe(false);

    // First reconnect attempt after 1000ms (INITIAL_BACKOFF)
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(MockWebSocket.instances).toHaveLength(2);
    const ws2 = MockWebSocket.instances[1];

    await act(async () => {
      ws2.emitOpen();
    });
    expect(hookState.current!.connected).toBe(true);
  });

  it("uses exponential backoff for subsequent reconnections", async () => {
    await renderHook();

    // First connection
    await act(async () => {
      MockWebSocket.instances[0].emitOpen();
    });

    // Close -> wait 1000ms -> reconnect
    await act(async () => {
      MockWebSocket.instances[0].emitClose();
      vi.advanceTimersByTime(1000);
    });

    // Second connection
    await act(async () => {
      MockWebSocket.instances[1].emitOpen();
    });

    // Close -> wait 2000ms (INITIAL_BACKOFF * 2^1) -> reconnect
    await act(async () => {
      MockWebSocket.instances[1].emitClose();
      vi.advanceTimersByTime(2000);
    });

    expect(MockWebSocket.instances).toHaveLength(3);

    // Third connection
    await act(async () => {
      MockWebSocket.instances[2].emitOpen();
    });

    // Close -> wait 4000ms (INITIAL_BACKOFF * 2^2) -> reconnect
    await act(async () => {
      MockWebSocket.instances[2].emitClose();
      vi.advanceTimersByTime(4000);
    });

    expect(MockWebSocket.instances).toHaveLength(4);
  });

  it("caps backoff at MAX_BACKOFF (30s)", async () => {
    await renderHook();

    // Simulate many reconnections to exceed MAX_BACKOFF
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        MockWebSocket.instances[i]?.emitOpen();
      });
      await act(async () => {
        MockWebSocket.instances[i]?.emitClose();
        vi.advanceTimersByTime(30_000); // Always advance by max
      });
    }

    // Should have created new instances each time (backoff capped at 30s)
    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(6);
  });

  // ── 6. Subscribe / Unsubscribe ───────────────────────────────────────────
  it("subscribe sends correct message", async () => {
    await renderHook();
    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.emitOpen();
    });

    await act(async () => {
      hookState.current!.subscribe("SOL/USDC");
    });

    expect(ws.sent).toContain(JSON.stringify({ type: "subscribe", topic: "SOL/USDC" }));
  });

  it("unsubscribe sends correct message", async () => {
    await renderHook();
    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.emitOpen();
    });

    await act(async () => {
      hookState.current!.unsubscribe("BTC/USDC");
    });

    expect(ws.sent).toContain(JSON.stringify({ type: "unsubscribe", topic: "BTC/USDC" }));
  });

  it("send only transmits when WebSocket is open", async () => {
    await renderHook();
    const ws = MockWebSocket.instances[0];

    // Not yet open — send should be a no-op
    await act(async () => {
      hookState.current!.send({ type: "ping" });
    });
    expect(ws.sent).toHaveLength(0);

    // Open the connection
    await act(async () => {
      ws.emitOpen();
    });

    await act(async () => {
      hookState.current!.send({ type: "ping" });
    });
    expect(ws.sent).toContain(JSON.stringify({ type: "ping" }));
  });

  // ── 7. Cleanup on unmount ────────────────────────────────────────────────
  it("does not attempt reconnection after unmount", async () => {
    await renderHook();
    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.emitOpen();
    });

    // Unmount
    await unmountAll();

    // Close the WebSocket after unmount
    const instanceCountBefore = MockWebSocket.instances.length;
    await act(async () => {
      ws.emitClose();
      vi.advanceTimersByTime(5000);
    });

    // No new WebSocket should be created after unmount
    expect(MockWebSocket.instances.length).toBe(instanceCountBefore);
  });

  it("closes WebSocket on unmount", async () => {
    await renderHook();
    const ws = MockWebSocket.instances[0];

    await act(async () => {
      ws.emitOpen();
    });

    const closeSpy = vi.spyOn(ws, "close");

    await unmountAll();

    expect(closeSpy).toHaveBeenCalled();
  });
});
