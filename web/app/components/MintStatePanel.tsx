"use client";

import { useEffect, useState } from "react";

const TOTAL_SLOTS = 20_000;
const RELAYER = process.env.NEXT_PUBLIC_RELAYER_URL ?? "http://localhost:3001";

interface PriceData {
  minted?: number;
  totalMinted?: number;
  real_sol_reserves?: number;
  graduated?: boolean;
}

export function MintStatePanel() {
  const [data, setData] = useState<PriceData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${RELAYER}/price`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setData(json);
      } catch {
        setError(true);
      }
    };
    load();
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, []);

  const minted = data?.totalMinted ?? data?.minted ?? null;
  const pct = minted !== null ? ((minted / TOTAL_SLOTS) * 100).toFixed(1) : null;
  const graduated = data?.graduated ?? false;

  return (
    <div className="stamp bg-[#1A0500] p-6">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[11px] uppercase tracking-widest text-white/40">public mint</span>
        <span className={`text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 stamp-sm ${graduated ? "bg-[#006064] text-white border-[#006064]" : "bg-[#C8102E] text-white"}`}>
          {graduated ? "GRADUATED" : error ? "OFFLINE" : "OPEN"}
        </span>
      </div>

      {/* Slot counter */}
      <div className="mb-6">
        <div className="flex items-end justify-between mb-2">
          <span className="font-black text-4xl text-white tabular-nums">
            {minted !== null ? minted.toLocaleString() : "—"}
          </span>
          <span className="text-white/40 text-sm font-mono">/ {TOTAL_SLOTS.toLocaleString()}</span>
        </div>
        {/* Progress bar */}
        <div className="h-3 bg-white/10 w-full">
          <div
            className="h-full bg-[#C8102E] transition-all duration-500"
            style={{ width: pct ? `${pct}%` : "0%" }}
          />
        </div>
        <p className="text-[11px] text-white/40 mt-1 font-mono">{pct ? `${pct}% filled` : "loading..."}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-px bg-white/10">
        {[
          { label: "per-wallet cap", value: "10 mints" },
          { label: "$BAO per mint", value: "250,000" },
          { label: "mint price", value: "0.022 SOL → LP" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#1A0500] p-3 space-y-1">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
            <p className="text-xs font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-white/30 font-mono mt-4">
        max supply: 10,000,000,000 $BAO hardcap
      </p>
    </div>
  );
}
