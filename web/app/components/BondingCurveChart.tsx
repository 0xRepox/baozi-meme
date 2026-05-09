"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
  ResponsiveContainer,
} from "recharts";

type CurveData = {
  virtualSolReserves: number;
  virtualTokenReserves: number;
  realSolReserves: number;
  graduated: boolean;
  pricePerToken: number;
  marketCapSol: number;
};

type ChartPoint = { sol: number; price: number };

function generateCurvePoints(virtualSol: number, virtualTokens: number): ChartPoint[] {
  const k = virtualSol * virtualTokens;
  const points: ChartPoint[] = [];
  for (let i = 0; i <= 40; i++) {
    const sol = virtualSol + (i / 40) * 85_000_000_000;
    const tokens = k / sol;
    const price = sol / tokens;
    points.push({ sol: parseFloat((sol / 1e9).toFixed(3)), price: parseFloat(price.toFixed(9)) });
  }
  return points;
}

const RELAYER = process.env.NEXT_PUBLIC_RELAYER_URL ?? "http://localhost:3001";

export function BondingCurveChart() {
  const [data, setData] = useState<CurveData | null>(null);
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [currentPoint, setCurrentPoint] = useState<ChartPoint | null>(null);

  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch(`${RELAYER}/price`);
        const json: { success: boolean } & CurveData = await res.json();
        if (!json.success) return;
        setData(json);
        const pts = generateCurvePoints(json.virtualSolReserves, json.virtualTokenReserves);
        setPoints(pts);
        const currentSol = json.virtualSolReserves / 1e9;
        setCurrentPoint({ sol: currentSol, price: json.pricePerToken });
      } catch {}
    }
    fetchPrice();
    const id = setInterval(fetchPrice, 10_000);
    return () => clearInterval(id);
  }, []);

  const raised = data ? (data.realSolReserves / 1e9).toFixed(3) : "0.000";
  const progress = data ? (data.realSolReserves / 85_000_000_000) * 100 : 0;

  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">Bonding Curve</p>
        {data?.graduated && (
          <span className="text-[10px] font-bold text-brand tracking-widest animate-pulse">
            GRADUATED
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff88" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="sol"
              tick={{ fill: "#444", fontSize: 9 }}
              tickFormatter={(v) => `${v}◎`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "#111",
                border: "1px solid #1f1f1f",
                borderRadius: 6,
                fontSize: 11,
                color: "#fff",
              }}
              formatter={(v: number) => [`${v.toFixed(9)} SOL`, "Price"]}
              labelFormatter={(l) => `${l} SOL raised`}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#00ff88"
              strokeWidth={1.5}
              fill="url(#priceGrad)"
              dot={false}
            />
            {currentPoint && (
              <ReferenceDot
                x={currentPoint.sol}
                y={currentPoint.price}
                r={4}
                fill="#00ff88"
                stroke="#0a0a0a"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Progress to graduation */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px]">
          <span className="text-gray-600">{raised} SOL raised</span>
          <span className="text-gray-500">85 SOL → Raydium</span>
        </div>
        <div className="w-full h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-700"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-right text-[11px] text-gray-600">{progress.toFixed(1)}%</p>
      </div>
    </div>
  );
}
