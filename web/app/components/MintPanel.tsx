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

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

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

      setMsg("Registered. You can now mint via chat.");
      await fetchStatus();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!connected) {
    return (
      <div className="bg-surface border border-border rounded-lg p-5 text-center">
        <p className="text-sm text-gray-500">Connect your wallet to mint</p>
      </div>
    );
  }

  if (!status?.registered) {
    return (
      <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">Registration</p>
        <p className="text-sm text-gray-400 leading-relaxed">
          Sign once to register. The relayer pays the fee — this is the only time you'll need
          to sign without Claude prompting you.
        </p>
        {msg && <p className="text-xs text-brand">{msg}</p>}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-2.5 bg-brand text-dark font-bold text-sm rounded hover:bg-green-400 transition disabled:opacity-50"
        >
          {loading ? "Signing..." : "Sign Once to Register"}
        </button>
      </div>
    );
  }

  const pct = ((status.mintsUsed / 10) * 100).toFixed(0);

  return (
    <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">Your Mints</p>
        <span className="text-xs text-gray-500 tabular-nums">{status.mintsUsed} / 10</span>
      </div>

      {/* Pip bar */}
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-colors ${
              i < status.mintsUsed ? "bg-brand" : "bg-border"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1">
        <div>
          <p className="text-[11px] text-gray-600">$BAO held</p>
          <p className="text-sm font-medium text-white mt-0.5">
            {(status.mintsUsed * 250_000).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-gray-600">Spent</p>
          <p className="text-sm font-medium text-white mt-0.5">
            {(status.totalSpentLamports / 1e9).toFixed(4)} SOL
          </p>
        </div>
        <div>
          <p className="text-[11px] text-gray-600">Remaining</p>
          <p className={`text-sm font-medium mt-0.5 ${status.mintsRemaining === 0 ? "text-gray-500" : "text-brand"}`}>
            {status.mintsRemaining} left
          </p>
        </div>
      </div>

      <p className="text-[11px] text-gray-600 border-t border-border pt-3">
        {status.mintsRemaining === 0
          ? "Max mints reached — chat to sell or check price."
          : 'Tell Claude "mint me some BAO" — 250,000 $BAO for $2 each.'}
      </p>
    </div>
  );
}
