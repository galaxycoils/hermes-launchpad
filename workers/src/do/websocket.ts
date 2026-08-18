// WebSocket Durable Object for Hermes Launchpad v2
// Handles real-time trade broadcasts, per-token subscriptions, and heartbeat

interface ClientMeta {
  wallet: string | null;
  subscriptions: Set<string>; // token IDs
  lastPong: number;
}

export class WebSocketHub {
  private state: DurableObjectState;
  private clients: Map<WebSocket, ClientMeta>;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.clients = new Map();
  }

  // Called when a new WebSocket connection is established
  async fetch(request: Request) {
    const url = new URL(request.url);

    // Handle WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

      this.state.acceptWebSocket(server);

      // Store client metadata
      this.clients.set(server, {
        wallet: null,
        subscriptions: new Set(),
        lastPong: Date.now(),
      });

      // Start heartbeat if not already running
      this.startHeartbeat();

      // Send welcome message
      server.send(JSON.stringify({
        type: "connected",
        ts: Date.now(),
        clients: this.clients.size,
      }));

      return new Response(null, { status: 101, webSocket: client });
    }

    // HTTP endpoint: broadcast a trade event (called by worker)
    if (url.pathname === "/broadcast" && request.method === "POST") {
      const body = await request.json().catch(() => ({})) as any;
      this.broadcast(body);
      return new Response(JSON.stringify({ ok: true, clients: this.clients.size }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // HTTP endpoint: broadcast to specific token subscribers
    if (url.pathname.startsWith("/broadcast/") && request.method === "POST") {
      const tokenId = url.pathname.split("/")[2];
      const body = await request.json().catch(() => ({})) as any;
      this.broadcastToToken(tokenId, body);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Stats endpoint
    if (url.pathname === "/stats") {
      return new Response(JSON.stringify({
        clients: this.clients.size,
        subscriptions: Array.from(this.clients.values()).reduce((acc, c) => acc + c.subscriptions.size, 0),
      }), { headers: { "Content-Type": "application/json" } });
    }

    return new Response("Not Found", { status: 404 });
  }

  // Handle messages from clients
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const data = JSON.parse(message as string);
      const meta = this.clients.get(ws);
      if (!meta) return;

      switch (data.type) {
        case "subscribe": {
          // Subscribe to token updates
          if (data.tokenId && typeof data.tokenId === "string") {
            meta.subscriptions.add(data.tokenId);
            ws.send(JSON.stringify({ type: "subscribed", tokenId: data.tokenId }));
          }
          break;
        }
        case "unsubscribe": {
          if (data.tokenId && typeof data.tokenId === "string") {
            meta.subscriptions.delete(data.tokenId);
            ws.send(JSON.stringify({ type: "unsubscribed", tokenId: data.tokenId }));
          }
          break;
        }
        case "pong": {
          // Client responded to ping
          meta.lastPong = Date.now();
          break;
        }
        case "auth": {
          // Authenticate with wallet address
          if (data.wallet && typeof data.wallet === "string") {
            meta.wallet = data.wallet;
            ws.send(JSON.stringify({ type: "auth_ok", wallet: data.wallet }));
          }
          break;
        }
        case "ping": {
          ws.send(JSON.stringify({ type: "pong", ts: Date.now() }));
          break;
        }
        default:
          ws.send(JSON.stringify({ type: "error", message: "unknown message type" }));
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: "error", message: "invalid message" }));
    }
  }

  // Handle WebSocket close
  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    this.clients.delete(ws);
    if (this.clients.size === 0) {
      this.stopHeartbeat();
    }
  }

  // Handle WebSocket error
  async webSocketError(ws: WebSocket, error: unknown) {
    this.clients.delete(ws);
    if (this.clients.size === 0) {
      this.stopHeartbeat();
    }
  }

  // Broadcast a message to all connected clients
  private broadcast(message: any) {
    const payload = JSON.stringify(message);
    for (const [ws] of this.clients) {
      try {
        ws.send(payload);
      } catch {
        // Client may be stale, will be cleaned up by heartbeat
      }
    }
  }

  // Broadcast to subscribers of a specific token
  private broadcastToToken(tokenId: string, message: any) {
    const payload = JSON.stringify({ ...message, tokenId });
    for (const [ws, meta] of this.clients) {
      if (meta.subscriptions.has(tokenId) || meta.subscriptions.size === 0) {
        try {
          ws.send(payload);
        } catch {
          // Client may be stale
        }
      }
    }
  }

  // Heartbeat: ping every 30s, close if no pong in 60s
  private startHeartbeat() {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 60 seconds without pong = dead

      for (const [ws, meta] of this.clients) {
        if (now - meta.lastPong > timeout) {
          // Client hasn't responded, close it
          try {
            ws.close(1000, "heartbeat timeout");
          } catch {
            // ignore
          }
          this.clients.delete(ws);
        } else {
          try {
            ws.send(JSON.stringify({ type: "ping", ts: now }));
          } catch {
            this.clients.delete(ws);
          }
        }
      }

      if (this.clients.size === 0) {
        this.stopHeartbeat();
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
