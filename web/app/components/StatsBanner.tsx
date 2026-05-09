"use client";

import { useEffect, useState } from "react";

const RELAYER = process.env.NEXT_PUBLIC_RELAYER_URL ?? "http://localhost:3001";

type PriceData = {
  pricePerToken: number;
  realSolReserves: number;
  marketCapSol: number;
  graduated: boolean;
};

export function StatsBanner() {
  const [data, setData] = useState<PriceData | null>(null);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`${RELAYER}/price`);
        const d = await res.json();
        if (d.success) setData(d);
      } catch {}
    }
    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, []);

  const raised = data ? (data.realSolReserves / 1e9).toFixed(2) : "—";
  const pct = data ? ((data.realSolReserves / 85_000_000_000) * 100).toFixed(1) : "0.0";
  const mcap = data ? data.marketCapSol.toFixed(2) : "—";

  return (
    <div className="border-b border-border bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs">
        <Stat label="Price" value={data ? `${data.pricePerToken.toFixed(8)} SOL` : "—"} />
        <div className="w-px h-3 bg-border hidden sm:block" />
        <Stat label="Raised" value={`${raised} / 85 SOL`} />
        <div className="w-px h-3 bg-border hidden sm:block" />
        <Stat label="To Raydium" value={`${pct}%`} highlight />
        <div className="w-px h-3 bg-border hidden sm:block" />
        <Stat label="Mkt Cap" value={`${mcap} SOL`} />
        {data?.graduated && (
          <>
            <div className="w-px h-3 bg-border hidden sm:block" />
            <span className="text-brand font-bold animate-pulse">GRADUATED ✓</span>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-600">{label}</span>
      <span className={`font-medium tabular-nums ${highlight ? "text-brand" : "text-gray-300"}`}>
        {value}
      </span>
    </div>
  );
}
