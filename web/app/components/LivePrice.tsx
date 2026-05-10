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

  if (!price) return null;

  return (
    <span className="hidden sm:flex items-center gap-1.5 text-[11px] tabular-nums font-bold">
      <span
        className={
          dir === "up"
            ? "text-[#006064]"
            : dir === "down"
            ? "text-[#E65100]"
            : "text-[#7A4200]"
        }
      >
        {price.toFixed(9)}
      </span>
      {dir === "up" && <span className="text-[#006064]">↑</span>}
      {dir === "down" && <span className="text-[#E65100]">↓</span>}
    </span>
  );
}
