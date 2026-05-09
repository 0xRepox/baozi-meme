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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-brand font-bold text-base tracking-tight">包子</span>
              <span className="font-bold text-base tracking-tight ml-1 text-white">BAOZI</span>
            </div>
            <LivePrice />
          </div>
          <WalletButton />
        </div>
      </header>

      {/* Stats bar */}
      <StatsBanner />

      {/* Hero */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-12 pb-8 text-center space-y-4">
        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight">
          <span className="text-brand">包</span>子
        </h2>
        <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          Chinese steamed bun. Solana meme coin.
          <br />
          Sign once — then just ask Claude.
        </p>
      </section>

      {/* Main grid */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          <BondingCurveChart />
          <MintPanel />
          <TokenInfoCard />
        </div>

        {/* Right column — chat is the hero */}
        <div className="lg:sticky lg:top-[73px] lg:self-start">
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
