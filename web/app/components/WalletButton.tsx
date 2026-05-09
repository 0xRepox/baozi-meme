"use client";

import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false, loading: () => (
    <button className="wallet-adapter-button text-xs font-bold uppercase tracking-widest px-5 py-2.5 border-2 border-[#2a2a2a] opacity-60">
      Connect
    </button>
  )}
);

export function WalletButton() {
  return <WalletMultiButton />;
}
