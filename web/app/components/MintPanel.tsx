"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";

const RELAYER = process.env.NEXT_PUBLIC_RELAYER_URL ?? "http://localhost:3001";

type UserStatus = {
  registered: boolean;
  mintsUsed: number;
  mintsRemaining: number;
  totalSpentLamports: number;
};

export function MintPanel() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchStatus = useCallback(async () => {
    if (!publicKey) return;
    try {
      const res = await fetch(`${RELAYER}/user/${publicKey.toBase58()}`);
      const d = await res.json();
      if (d.success) setStatus(d);
    } catch {}
  }, [publicKey]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function handleRegister() {
    if (!publicKey || !signTransaction) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`${RELAYER}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const tx = Transaction.from(Buffer.from(data.transaction, "base64"));
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      setMsg("registered. now chat to mint.");
      await fetchStatus();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "failed");
    } finally {
      setLoading(false);
    }
  }

  /* ── not connected ── */
  if (!connected) {
    return (
      <div className="border-2 border-[#1e1e1e] bg-[#0f0f0f] p-5 h-full flex flex-col">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#444] mb-4 font-bold">UR STATUS</p>
        <div className="flex-1 flex flex-col gap-3 text-sm">
          <Row label="wallet" value="— connect wallet —" />
          <Row label="mints used" value="—" />
          <Row label="ur bag" value="—" />
          <Row label="registered" value="—" />
        </div>
        <p className="text-[11px] text-[#444] mt-5 pt-4 border-t border-[#1a1a1a]">
          connect ur wallet to get some $bao. much required.
        </p>
      </div>
    );
  }

  /* ── not registered ── */
  if (!status?.registered) {
    return (
      <div className="border-2 border-[#1e1e1e] bg-[#0f0f0f] p-5 h-full flex flex-col">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#444] mb-4 font-bold">UR STATUS</p>
        <div className="flex-1 flex flex-col gap-3 text-sm">
          <Row label="wallet" value={`${publicKey!.toBase58().slice(0, 6)}…${publicKey!.toBase58().slice(-4)}`} />
          <Row label="registered" value="NO" warn />
          <Row label="mints used" value="—" />
          <Row label="ur bag" value="—" />
        </div>
        {msg && <p className="text-[11px] text-[#00ff88] mt-3">{msg}</p>}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="mt-5 w-full bg-[#00ff88] text-[#0a0a0a] font-black uppercase text-xs py-3 tracking-widest hover:bg-[#00cc6a] transition-colors disabled:opacity-50"
        >
          {loading ? "SIGNING..." : "SIGN ONCE TO REGISTER →"}
        </button>
        <p className="text-[11px] text-[#444] mt-2 text-center">relayer covers the gas fee</p>
      </div>
    );
  }

  /* ── registered ── */
  const bagSize = (status.mintsUsed * 250_000).toLocaleString();
  const spent = (status.totalSpentLamports / 1e9).toFixed(4);

  return (
    <div className="border-2 border-[#1e1e1e] bg-[#0f0f0f] p-5 h-full flex flex-col">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#444] mb-4 font-bold">UR STATUS</p>

      <div className="flex-1 flex flex-col gap-3 text-sm">
        <Row label="wallet" value={`${publicKey!.toBase58().slice(0, 6)}…${publicKey!.toBase58().slice(-4)}`} />
        <Row label="registered" value="YES ✓" green />
        <Row label="mints used" value={`${status.mintsUsed} / 10`} />
        <Row label="ur bag" value={`${bagSize} $BAO`} />
        <Row label="spent" value={`${spent} SOL`} />
        <Row
          label="remaining"
          value={status.mintsRemaining === 0 ? "maxed out" : `${status.mintsRemaining} left`}
          warn={status.mintsRemaining === 0}
          green={status.mintsRemaining > 0}
        />
      </div>

      {/* Mint progress pips */}
      <div className="mt-5 pt-4 border-t border-[#1a1a1a] space-y-2">
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 ${i < status.mintsUsed ? "bg-[#00ff88]" : "bg-[#1e1e1e]"}`}
            />
          ))}
        </div>
        <p className="text-[11px] text-[#444]">
          {status.mintsRemaining === 0
            ? "max mints reached — sell or check price via chat"
            : 'say "mint me some bao" in chat → 250k $BAO for $2'}
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  green,
  warn,
}: {
  label: string;
  value: string;
  green?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-[#141414]">
      <span className="text-[11px] text-[#555] uppercase tracking-wider shrink-0">{label}</span>
      <span
        className={`text-xs font-bold text-right ${
          green ? "text-[#00ff88]" : warn ? "text-yellow-500" : "text-[#aaa]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
