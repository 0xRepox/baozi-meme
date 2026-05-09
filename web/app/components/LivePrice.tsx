"use client";

import { useEffect, useState } from "react";

const RELAYER = process.env.NEXT_PUBLIC_RELAYER_URL ?? "http://localhost:3001";

export function LivePrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [dir, setDir] = useState<"up" | "down" | "same">("same");

  useEffect(() => {
    let prev: number | null = null;

    async function poll() {
      try {
        const res = await fetch(`${RELAYER}/price`);
        const d = await res.json();
        if (!d.success) return;
        if (prev !== null) {
          setDir(d.pricePerToken > prev ? "up" : d.pricePerToken < prev ? "down" : "same");
        }
        prev = d.pricePerToken;
        setPrice(d.pricePerToken);
      } catch {}
    }

    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, []);

  if (!price) return <span className="text-xs text-gray-600">loading...</span>;

  return (
    <div className="flex items-center gap-1.5 text-xs tabular-nums">
      <span className="text-gray-500">$BAO</span>
      <span className={dir === "up" ? "text-green-400" : dir === "down" ? "text-red-400" : "text-gray-300"}>
        {price.toFixed(8)}
      </span>
      {dir === "up" && <span className="text-green-400">↑</span>}
      {dir === "down" && <span className="text-red-400">↓</span>}
    </div>
  );
}
