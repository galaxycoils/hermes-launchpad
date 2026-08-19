import { useCallback, useEffect, useRef, useState } from "react";

export type WsMessageType = "trade" | "price" | "notification";

export interface WsMessage {
  type: WsMessageType;
  data: unknown;
  ts: number;
}

export interface UseWebSocketReturn {
  connected: boolean;
  messages: WsMessage[];
  send: (msg: unknown) => void;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
}

const WS_ENDPOINT = "wss://hermes-api.tahamtandariush.workers.dev/ws";
const HEARTBEAT_INTERVAL = 30_000;
const MAX_BACKOFF = 30_000;
const INITIAL_BACKOFF = 1_000;
const MAX_MESSAGES = 100;

function getBackoff(attempt: number): number {
  return Math.min(INITIAL_BACKOFF * 2 ** attempt, MAX_BACKOFF);
}

export function useWebSocket(): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const deadRef = useRef(false);
  const connectRef = useRef<(() => void) | null>(null);

  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WsMessage[]>([]);

  const clearTimers = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    heartbeatTimer.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  const connect = useCallback(() => {
    if (deadRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    clearTimers();
    const ws = new WebSocket(WS_ENDPOINT);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempts.current = 0;
      setConnected(true);
      startHeartbeat();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsMessage;
        setMessages((prev) => {
          const next = [...prev, msg];
          return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
        });
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setConnected(false);
      clearTimers();
      if (deadRef.current) return;
      const delay = getBackoff(reconnectAttempts.current);
      reconnectAttempts.current += 1;
      reconnectTimer.current = setTimeout(() => connectRef.current?.(), delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [clearTimers, startHeartbeat]);

  // Store connect in ref for use in onclose
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    deadRef.current = false;
    connect();
    return () => {
      deadRef.current = true;
      clearTimers();
      wsRef.current?.close();
    };
  }, [connect, clearTimers]);

  const send = useCallback((msg: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const subscribe = useCallback((topic: string) => {
    send({ type: "subscribe", topic });
  }, [send]);

  const unsubscribe = useCallback((topic: string) => {
    send({ type: "unsubscribe", topic });
  }, [send]);

  return { connected, messages, send, subscribe, unsubscribe };
}
