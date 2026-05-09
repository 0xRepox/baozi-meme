import Image from "next/image";
import { BondingCurveChart } from "./components/BondingCurveChart";
import { MintPanel } from "./components/MintPanel";
import { ChatWidget } from "./components/ChatWidget";
import { LivePrice } from "./components/LivePrice";
import { HowItWorks } from "./components/HowItWorks";
import { StatsBanner } from "./components/StatsBanner";
import { WalletButton } from "./components/WalletButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-dark text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src="/bao/chill.jpeg"
                alt="BAOZI"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-brand font-bold text-sm tracking-tight">包子</span>
              <span className="font-bold text-sm tracking-tight ml-1 text-white">BAOZI</span>
            </div>
            <LivePrice />
          </div>
          <WalletButton />
        </div>
      </header>

      {/* Stats bar */}
      <StatsBanner />

      {/* Hero */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-10 pb-8">
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
          {/* Text side */}
          <div className="flex-1 space-y-5 text-center sm:text-left">
            <h2 className="text-5xl sm:text-7xl font-bold tracking-tight leading-none">
              <span className="text-brand">包</span>子
            </h2>
            <p className="text-gray-400 text-base leading-relaxed max-w-xs mx-auto sm:mx-0">
              Chinese steamed bun. Solana meme coin.
              <br />
              Sign once — then just ask Claude.
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start text-[11px] text-gray-600">
              <span className="px-2 py-1 border border-border rounded">Fair Launch</span>
              <span className="px-2 py-1 border border-border rounded">10B Supply</span>
              <span className="px-2 py-1 border border-border rounded">Claude AI</span>
              <span className="px-2 py-1 border border-border rounded">Raydium →</span>
            </div>
          </div>

          {/* Mascot side */}
          <div className="flex-shrink-0">
            <div className="w-52 h-52 sm:w-72 sm:h-72 rounded-3xl overflow-hidden ring-1 ring-white/5 shadow-2xl">
              <Image
                src="/bao/chill.jpeg"
                alt="BAOZI mascot"
                width={288}
                height={288}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          <BondingCurveChart />
          <MintPanel />
          <TokenInfoCard />
        </div>

        {/* Right column — chat is the hero feature */}
        <div className="lg:sticky lg:top-[65px] lg:self-start">
          <ChatWidget />
        </div>
      </div>

      <HowItWorks />

      <footer className="border-t border-border px-6 py-4 text-center">
        <p className="text-[11px] text-gray-700">
          $BAO · Fair Launch · 0% Team · 1% Trading Fee · Graduates to Raydium at 85 SOL
        </p>
      </footer>
    </main>
  );
}

function TokenInfoCard() {
  const rows = [
    ["Total Supply", "10,000,000,000"],
    ["Public Mint", "5,000,000,000 (50%)"],
    ["LP Reserve", "5,000,000,000 (50%)"],
    ["Team", "0 — fair launch"],
    ["Per Mint", "250,000 $BAO"],
    ["Mint Price", "$2 in SOL"],
    ["Max per Wallet", "10 mints"],
    ["Trading Fee", "1%"],
  ] as const;

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-4">Token Info</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-[11px] text-gray-600">{label}</p>
            <p className={`text-sm font-medium mt-0.5 ${value.includes("fair") ? "text-brand" : "text-white"}`}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
