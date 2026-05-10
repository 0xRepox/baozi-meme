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
  "How many slots are left?",
];

export function ChatWidget() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "包子 ready. say the word — i can mint, sell, or check price." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
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
            ? { ...m, txSigned: true, content: m.content + `\n\n✓ confirmed: ${sig.slice(0, 16)}…` }
            : m
        )
      );
    } catch (err) {
      const text = err instanceof Error ? err.message : "tx failed";
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
          body: JSON.stringify({ messages: [...messages, userMsg], wallet: publicKey?.toBase58() }),
        });
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply ?? "something went wrong.",
            transaction: data.transaction ?? undefined,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "network error — try again." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [connected, loading, messages, publicKey]
  );

  if (!connected) {
    return (
      <div className="bg-white stamp flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-[#7A4200] text-sm uppercase tracking-widest font-bold">connect wallet to chat</p>
        <p className="text-[#C8102E]/40 text-xs">claude handles the rest</p>
      </div>
    );
  }

  return (
    <div className="bg-white stamp flex flex-col" style={{ height: 520 }}>
      {/* Header */}
      <div className="bg-[#C8102E] px-4 py-2 flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#006064] animate-pulse" />
        <span className="text-[11px] uppercase tracking-widest text-white font-bold">CLAUDE</span>
        <span className="text-white/60 text-[11px]">· mcp bridge active</span>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%] space-y-2">
              {m.role === "assistant" && (
                <p className="text-[10px] text-[#7A4200] uppercase tracking-widest mb-1">claude</p>
              )}
              <div
                className={`px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap font-mono ${
                  m.role === "user"
                    ? "bg-[#C8102E] text-white font-bold"
                    : "bg-[#FFF8E1] border border-[#e8c060] text-[#1A0500]"
                }`}
              >
                {m.content}
              </div>
              {m.transaction && !m.txSigned && (
                <button
                  onClick={() => signAndSubmit(m.transaction!, i)}
                  className="w-full py-2.5 text-[#C8102E] text-xs font-black uppercase tracking-widest stamp-btn"
                >
                  APPROVE IN WALLET →
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="border border-[#e8c060] bg-[#FFF8E1] px-3 py-2 text-xs text-[#7A4200] font-mono">
              <span className="animate-pulse">thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* Starter prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 bg-white">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-[11px] px-2.5 py-1 border border-[#C8102E]/30 text-[#7A4200] hover:border-[#C8102E] hover:text-[#C8102E] transition-colors uppercase tracking-wide"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t-2 border-[#C8102E]/20 flex gap-2 bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="mint, sell, price…"
          className="flex-1 bg-white border border-[#C8102E]/30 px-3 py-2 text-sm text-[#1A0500] placeholder-[#c4a460] outline-none focus:border-[#C8102E] transition-colors font-mono"
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="px-5 py-2 bg-[#C8102E] text-white text-xs font-black uppercase tracking-widest stamp-btn"
        >
          SEND
        </button>
      </div>
    </div>
  );
}
