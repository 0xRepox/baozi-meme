"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";

export function WalletButton() {
  const { wallets, wallet, select, connect, disconnect, connected, connecting, publicKey } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [pendingConnect, setPendingConnect] = useState(false);

  useEffect(() => setMounted(true), []);

  // After select() settles in React state, call connect() from the provider
  useEffect(() => {
    if (!pendingConnect || !wallet || connected || connecting) return;
    setPendingConnect(false);
    connect().catch(() => window.open("https://phantom.app", "_blank"));
  }, [pendingConnect, wallet, connected, connecting, connect]);

  const handleConnect = useCallback(() => {
    const phantom = wallets.find((w) => w.adapter.name === "Phantom");
    const solflare = wallets.find((w) => w.adapter.name === "Solflare");
    const target = phantom ?? solflare ?? wallets[0];

    if (!target) {
      window.open("https://phantom.app", "_blank");
      return;
    }

    select(target.adapter.name);
    setPendingConnect(true);
  }, [wallets, select]);

  const handleDisconnect = useCallback(() => disconnect(), [disconnect]);

  if (!mounted) {
    return (
      <button
        disabled
        className="stamp-btn px-5 py-2.5 text-xs font-black uppercase tracking-widest opacity-60"
      >
        CONNECT
      </button>
    );
  }

  if (connected && publicKey) {
    const addr = publicKey.toBase58();
    return (
      <button
        onClick={handleDisconnect}
        className="stamp-btn px-4 py-2.5 text-xs font-black uppercase tracking-widest bg-[#C8102E] text-white"
      >
        {addr.slice(0, 4)}..{addr.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      className="stamp-btn px-5 py-2.5 text-xs font-black uppercase tracking-widest"
    >
      {connecting ? "CONNECTING…" : "CONNECT"}
    </button>
  );
}
