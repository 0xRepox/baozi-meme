"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";

type Message = {
  role: "user" | "assistant";
  content: string;
  transaction?: string;
  txSigned?: boolean;
};

const STARTERS = [
  "What's the current price?",
  "How many mints do I have left?",
  "Mint me some BAO",
  "Show me bonding curve status",
];

export function ChatWidget() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "包子 ready. Say the word — I can mint, sell, or check price.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function signAndSubmit(txBase64: string, msgIndex: number) {
    if (!signTransaction) return;
    try {
      const tx = Transaction.from(Buffer.from(txBase64, "base64"));
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");

      setMessages((prev) =>
        prev.map((m, i) =>
          i === msgIndex
            ? { ...m, txSigned: true, content: m.content + `\n\n✓ Confirmed: ${sig.slice(0, 16)}…` }
            : m
        )
      );
    } catch (err) {
      const text = err instanceof Error ? err.message : "Transaction failed";
      setMessages((prev) =>
        prev.map((m, i) => (i === msgIndex ? { ...m, content: m.content + `\n\n✗ ${text}` } : m))
      );
    }
  }

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || !connected || loading) return;

      const userMsg: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            wallet: publicKey?.toBase58(),
          }),
        });
        const data = await res.json();
        const assistantMsg: Message = {
          role: "assistant",
          content: data.reply ?? "Something went wrong.",
          transaction: data.transaction ?? undefined,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Network error — try again." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [connected, loading, messages, publicKey]
  );

  if (!connected) {
    return (
      <div className="bg-surface border border-border rounded-lg p-8 text-center">
        <p className="text-gray-500 text-sm">Connect wallet to chat</p>
        <p className="text-gray-700 text-xs mt-1">Claude handles the rest</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg flex flex-col" style={{ height: 480 }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
        <span className="text-xs text-gray-500">Claude</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[82%] space-y-2">
              <div
                className={`px-3 py-2 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-brand text-dark font-medium"
                    : "bg-[#161616] text-gray-200 border border-border"
                }`}
              >
                {m.content}
              </div>
              {m.transaction && !m.txSigned && (
                <button
                  onClick={() => signAndSubmit(m.transaction!, i)}
                  className="w-full py-2 bg-brand/10 border border-brand/40 text-brand text-xs font-medium rounded-lg hover:bg-brand/20 transition"
                >
                  Approve in Wallet →
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#161616] border border-border px-3 py-2 rounded-lg text-xs text-gray-600">
              <span className="animate-pulse">thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Starter prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs px-2.5 py-1 border border-border rounded-md text-gray-500 hover:border-brand/50 hover:text-brand transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="mint, sell, price…"
          className="flex-1 bg-dark border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-700 outline-none focus:border-brand/50 transition"
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-brand text-dark text-sm font-bold rounded-lg hover:bg-green-400 transition disabled:opacity-30"
        >
          Send
        </button>
      </div>
    </div>
  );
}
