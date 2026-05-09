import Image from "next/image";
import { BondingCurveChart } from "./components/BondingCurveChart";
import { MintPanel } from "./components/MintPanel";
import { ChatWidget } from "./components/ChatWidget";
import { HowItWorks } from "./components/HowItWorks";
import { WalletButton } from "./components/WalletButton";
import { LivePrice } from "./components/LivePrice";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b-2 border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/bao/chill.jpeg" alt="BAO" width={28} height={28} className="rounded" />
            <span className="font-black text-sm tracking-tight uppercase">BAOZI <span className="text-[#555] font-normal">$bao</span></span>
          </div>
          <div className="flex items-center gap-4">
            <LivePrice />
            <span className="hidden sm:block text-[11px] text-[#444] uppercase tracking-widest">solana · devnet</span>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-5 pt-14 pb-12">
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {["MCP", "CLAUDE", "SOLANA", "FAIR LAUNCH"].map((t) => (
            <span key={t} className="text-[11px] font-bold border border-[#2a2a2a] px-2 py-0.5 uppercase tracking-widest text-[#888]">
              {t}
            </span>
          ))}
          <span className="text-[#444] font-bold text-lg ml-1">/</span>
          <span className="text-[11px] text-[#555]">the first meme coin you mint through claude.</span>
        </div>

        {/* Big headline */}
        <h1 className="font-black uppercase leading-[0.88] tracking-tighter text-[clamp(52px,12vw,108px)]">
          MINT $BAO
          <br />THROUGH
          <br />CLAUDE
        </h1>

        {/* Outlined subheadline */}
        <p className="text-outline font-black uppercase leading-tight tracking-tight mt-4 text-[clamp(20px,4.5vw,44px)]">
          ONE SIGN. CLAUDE MINTS. 包子.
        </p>

        {/* Body copy */}
        <p className="text-[#666] text-sm mt-6 max-w-lg leading-relaxed">
          sign once to register ur wallet. after that, tell claude{" "}
          <span className="text-[#aaa] font-bold">"mint me some bao"</span>. the relayer ships
          mint txs on ur behalf. only u get credited. zero trust, max bao, no rug.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 mt-8">
          <a
            href="#chat"
            className="inline-block bg-[#00ff88] text-[#0a0a0a] font-black uppercase text-sm px-6 py-3 tracking-wide hover:bg-[#00cc6a] transition-colors"
          >
            CHAT WITH CLAUDE →
          </a>
          <WalletButton />
        </div>
      </section>

      {/* ── Chat + Mint ── */}
      <section id="chat" className="max-w-4xl mx-auto px-5 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <ChatWidget />
          </div>
          <div className="lg:col-span-2">
            <MintPanel />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t-2 border-[#1a1a1a]">
        <HowItWorks />
      </section>

      {/* ── Bonding Curve ── */}
      <section className="border-t-2 border-[#1a1a1a] py-10">
        <div className="max-w-4xl mx-auto px-5">
          <BondingCurveChart />
        </div>
      </section>

      {/* ── Token Info ── */}
      <section className="border-t-2 border-[#1a1a1a] py-10">
        <div className="max-w-4xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#555] mb-6">Token Info</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#1a1a1a] border-2 border-[#1a1a1a]">
            {TOKEN_INFO.map(([label, value, accent]) => (
              <div key={label} className="bg-[#0a0a0a] p-4 space-y-1">
                <p className="text-[11px] text-[#555] uppercase tracking-wider">{label}</p>
                <p className={`text-sm font-bold ${accent ? "text-[#00ff88]" : "text-white"}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t-2 border-[#1a1a1a] py-6 text-center">
        <p className="text-[11px] text-[#444] uppercase tracking-widest">
          $BAO · Fair Launch · 0% Team · 1% Fee · Raydium at 85 SOL
        </p>
      </footer>
    </main>
  );
}

const TOKEN_INFO: [string, string, boolean?][] = [
  ["Total Supply", "10,000,000,000"],
  ["Public Mint", "5B (50%)"],
  ["LP Reserve", "5B (50%)"],
  ["Team", "0 — fair launch", true],
  ["Per Mint", "250,000 $BAO"],
  ["Mint Price", "$2 in SOL"],
  ["Max / Wallet", "10 mints"],
  ["Trading Fee", "1%"],
];
