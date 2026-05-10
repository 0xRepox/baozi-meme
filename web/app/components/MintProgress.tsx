"use client";

import { useEffect, useState } from "react";

const RELAYER = process.env.NEXT_PUBLIC_RELAYER_URL ?? "http://localhost:3001";

export function MintProgress() {
  const [totalMinted, setTotalMinted] = useState(0);
  const [progressPct, setProgressPct] = useState(0);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`${RELAYER}/price`);
        const json = await res.json();
        if (json.success) {
          setTotalMinted(json.totalMinted ?? 0);
          setProgressPct(json.progressPct ?? 0);
        }
      } catch {}
    }
    poll();
    const id = setInterval(poll, 5_000);
    return () => clearInterval(id);
  }, []);

  const remaining = 20_000 - totalMinted;

  return (
    <div className="bg-white stamp p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#7A4200] font-bold">Mint Progress</p>
        <span className="text-[#C8102E] font-bold text-xs">{progressPct.toFixed(1)}% filled</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-[#f0d080] rounded-none overflow-hidden">
        <div
          className="h-full bg-[#C8102E] transition-all duration-700"
          style={{ width: `${Math.min(progressPct, 100)}%` }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-[10px] text-[#7A4200] uppercase tracking-wider">Minted</p>
          <p className="text-sm font-bold text-[#C8102E] tabular-nums mt-0.5">
            {totalMinted.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#7A4200] uppercase tracking-wider">Remaining</p>
          <p className="text-sm font-bold text-[#1A0500] tabular-nums mt-0.5">
            {remaining.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#7A4200] uppercase tracking-wider">Total Slots</p>
          <p className="text-sm font-bold text-[#1A0500] tabular-nums mt-0.5">20,000</p>
        </div>
      </div>

      <p className="text-[11px] text-[#7A4200] text-center">
        0.022 SOL per mint · 250,000 $BAO per slot · 20,000 total slots
      </p>
    </div>
  );
}
