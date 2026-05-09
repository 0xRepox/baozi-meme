"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, Tooltip, ReferenceDot, ResponsiveContainer } from "recharts";

type CurveData = {
  virtualSolReserves: number;
  virtualTokenReserves: number;
  realSolReserves: number;
  graduated: boolean;
  pricePerToken: number;
  marketCapSol: number;
};

type ChartPoint = { sol: number; price: number };

function generatePoints(virtualSol: number, virtualTokens: number): ChartPoint[] {
  const k = virtualSol * virtualTokens;
  return Array.from({ length: 41 }, (_, i) => {
    const sol = virtualSol + (i / 40) * 85_000_000_000;
    const price = sol / (k / sol);
    return { sol: parseFloat((sol / 1e9).toFixed(2)), price: parseFloat(price.toFixed(9)) };
  });
}

const RELAYER = process.env.NEXT_PUBLIC_RELAYER_URL ?? "http://localhost:3001";

export function BondingCurveChart() {
  const [data, setData] = useState<CurveData | null>(null);
  const [points, setPoints] = useState<ChartPoint[]>([]);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`${RELAYER}/price`);
        const json: { success: boolean } & CurveData = await res.json();
        if (!json.success) return;
        setData(json);
        setPoints(generatePoints(json.virtualSolReserves, json.virtualTokenReserves));
      } catch {}
    }
    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, []);

  const raised = data ? (data.realSolReserves / 1e9).toFixed(3) : "0.000";
  const pct = data ? (data.realSolReserves / 85_000_000_000) * 100 : 0;
  const currentSol = data ? data.virtualSolReserves / 1e9 : null;

  return (
    <div className="border-2 border-[#1e1e1e] bg-[#0f0f0f] p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#444] font-bold">Bonding Curve</p>
        <div className="flex items-center gap-4 text-xs">
          {data?.graduated && (
            <span className="text-[#00ff88] font-black uppercase tracking-widest animate-pulse">GRADUATED ✓</span>
          )}
          <span className="text-[#555]">{raised} / 85 SOL</span>
          <span className="text-[#00ff88] font-bold">{pct.toFixed(1)}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[#1a1a1a]">
        <div
          className="h-full bg-[#00ff88] transition-all duration-700"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-[10px] text-[#444] uppercase tracking-wider">Price</p>
          <p className="text-sm font-bold text-[#00ff88] tabular-nums mt-0.5">
            {data?.pricePerToken?.toFixed(9) ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#444] uppercase tracking-wider">Mkt Cap</p>
          <p className="text-sm font-bold text-white tabular-nums mt-0.5">
            {data?.marketCapSol?.toFixed(2) ?? "—"} SOL
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#444] uppercase tracking-wider">To Raydium</p>
          <p className="text-sm font-bold text-white tabular-nums mt-0.5">
            {(85 - (data?.realSolReserves ?? 0) / 1e9).toFixed(2)} SOL
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff88" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="sol"
              tick={{ fill: "#333", fontSize: 9 }}
              tickFormatter={(v) => `${v}◎`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: "#111", border: "1px solid #2a2a2a", fontSize: 11, color: "#fff" }}
              formatter={(v: number) => [`${v.toFixed(9)} SOL`, "Price"]}
              labelFormatter={(l) => `${l} SOL raised`}
            />
            <Area type="monotone" dataKey="price" stroke="#00ff88" strokeWidth={1.5} fill="url(#g)" dot={false} />
            {currentSol !== null && data && (
              <ReferenceDot
                x={currentSol}
                y={data.pricePerToken}
                r={4}
                fill="#00ff88"
                stroke="#0a0a0a"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-[#444] text-center">
        graduates to raydium at 85 SOL raised
      </p>
    </div>
  );
}
