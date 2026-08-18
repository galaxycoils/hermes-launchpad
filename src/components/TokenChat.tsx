import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import Avatar from "@/components/Avatar";

interface ChatMessage {
  type: "chat";
  data: {
    wallet: string;
    message: string;
    ts: number;
    replyTo?: string;
  };
}

interface Message extends ChatMessage {
  id: string;
}

interface TokenChatProps {
  tokenId: string;
  wallet: string | null;
}

const shortWallet = (w: string) =>
  w.length > 10 ? w.slice(0, 4) + "\u2026" + w.slice(-4) : w;

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const isChatMessage = (msg: { type: string; data: unknown }): msg is ChatMessage =>
  msg.type === "chat";

export default function TokenChat({ tokenId, wallet }: TokenChatProps) {
  const { connected, messages, send, subscribe, unsubscribe } = useWebSocket();
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to this token\'s chat channel
  useEffect(() => {
    subscribe(`chat:${tokenId}`);
    return () => unsubscribe(`chat:${tokenId}`);
  }, [tokenId, subscribe, unsubscribe]);

  // Filter + map messages for this token
  const chatMessages = useMemo<Message[]>(() => {
    return messages
      .filter(isChatMessage)
      .map((msg, i) => ({
        ...msg,
        id: `${msg.ts}-${(msg.data as ChatMessage["data"]).wallet}-${i}`,
      }));
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chatMessages]);

  // Send a chat message
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !wallet) return;

    send({
      type: "chat",
      data: {
        wallet,
        message: trimmed,
        ts: Date.now(),
        ...(replyingTo ? { replyTo: replyingTo } : {}),
      },
    });

    setInput("");
    setReplyingTo(null);
    inputRef.current?.focus();
  }, [input, wallet, replyingTo, send]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const quoted = replyingTo
    ? chatMessages.find((m) => m.id === replyingTo)
    : null;

  return (
    <div className="surface rounded-xl border bg-black/80 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">Chat</h3>
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              connected ? "bg-pump animate-pulse" : "bg-red-500"
            }`}
          />
          <span className="text-xs text-white/40 font-mono">
            {connected ? "live" : "offline"}
          </span>
        </div>
        <span className="text-[10px] text-white/30 font-mono">
          {chatMessages.length} msgs
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-[280px] max-h-[400px] px-3 py-3 space-y-2 scrollbar-thin"
        style={{ scrollBehavior: "smooth" }}
      >
        {chatMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-white/30">
            {connected ? "No messages yet. Be the first to say something!" : "Connecting\u2026"}
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isOwn = msg.data.wallet === wallet;
            const repliedMsg = msg.data.replyTo
              ? chatMessages.find((m) => m.id === msg.data.replyTo)
              : null;

            return (
              <div key={msg.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                <div className="flex-shrink-0 mt-0.5">
                  <Avatar value={msg.data.wallet} size="sm" />
                </div>
                <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                  {/* Sender + timestamp */}
                  <div className={`flex items-baseline gap-2 mb-0.5 ${isOwn ? "flex-row-reverse" : ""}`}>
                    <span className="text-[11px] font-semibold text-white/50">
                      {shortWallet(msg.data.wallet)}
                    </span>
                    <span className="text-[10px] font-mono text-white/30">
                      {formatTime(msg.ts)}
                    </span>
                  </div>

                  {/* Reply preview */}
                  {repliedMsg && (
                    <div className="mb-1 rounded border-l-2 border-white/20 bg-white/5 px-2 py-1">
                      <div className="text-[10px] text-white/40">
                        {shortWallet(repliedMsg.data.wallet)}
                      </div>
                      <div className="text-[11px] text-white/50 truncate">
                        {repliedMsg.data.message}
                      </div>
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-snug break-words ${
                      isOwn
                        ? "bg-pump/20 text-white rounded-tr-sm"
                        : "bg-white/[0.07] text-white/90 rounded-tl-sm"
                    }`}
                  >
                    {msg.data.message}
                  </div>

                  {/* Reply button */}
                  {!isOwn && wallet && (
                    <button
                      onClick={() => setReplyingTo(msg.id)}
                      className="mt-0.5 text-[10px] text-white/30 hover:text-white/60 transition-colors"
                    >
                      reply
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply indicator */}
      {quoted && (
        <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-3 py-1.5">
          <span className="text-[11px] text-white/40 truncate">
            replying to {shortWallet(quoted.data.wallet)}: {quoted.data.message}
          </span>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-white/40 hover:text-white/70 text-xs ml-2"
          >
            x
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/10 p-3">
        {wallet ? (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Say something\u2026"
              maxLength={500}
              className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="rounded-lg bg-pump/20 text-pump px-4 py-2 text-sm font-semibold border border-pump/30 hover:bg-pump/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        ) : (
          <div className="text-center text-xs text-white/30 py-2">
            Connect wallet to chat
          </div>
        )}
      </div>
    </div>
  );
}
