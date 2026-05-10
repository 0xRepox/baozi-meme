import Image from "next/image";
import Link from "next/link";
import { MintProgress } from "./components/MintProgress";
import { MintPanel } from "./components/MintPanel";
import { ChatWidget } from "./components/ChatWidget";
import { HowItWorks } from "./components/HowItWorks";
import { WalletButton } from "./components/WalletButton";
import { LivePrice } from "./components/LivePrice";

const TOKEN_INFO: [string, string][] = [
  ["Total Supply", "10,000,000,000"],
  ["Public Mint", "5B (50%)"],
  ["LP Reserve", "5B (50%)"],
  ["Team", "0 — fair launch"],
  ["Per Mint", "250,000 $BAO"],
  ["Mint Price", "0.022 SOL"],
  ["Max / Wallet", "10 mints"],
  ["Dev Revenue", "LP fee share only"],
  ["Total Slots", "20,000"],
  ["LP", "100% at graduation"],
];

const TICKER_TEXT =
  "250,000 $BAO PER MINT · 0.022 SOL · 20,000 SLOTS · MAX 10/WALLET · FAIR LAUNCH · 0% TEAM · 100% TO METEORA LP · LP FEE SHARE ONLY · ";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7C500] text-[#1A0500]">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b-4 border-[#C8102E] bg-white">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 bg-[#F7C500] stamp-sm px-3 py-1.5">
            <Image src="/bao/t-chill.png" alt="BAO" width={24} height={24} />
            <span className="font-black text-sm tracking-tight uppercase text-[#1A0500]">
              包子 <span className="text-[#C8102E]">$BAO</span>
            </span>
          </div>

          {/* Center nav */}
          <nav className="hidden sm:flex items-center gap-6">
            {[["HOW IT WORKS", "/how"], ["TOKENOMICS", "/tokenomics"], ["RECEIPTS", "/receipts"]].map(([label, href]) => (
              <Link key={href} href={href}
                className="text-[11px] font-bold uppercase tracking-widest text-[#7A4200] hover:bg-[#C8102E] hover:text-white px-3 py-1.5 stamp-sm transition-colors">
                {label}
              </Link>
            ))}
          </nav>

          {/* Right: price + wallet */}
          <div className="flex items-center gap-4">
            <LivePrice />
            <WalletButton />
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-[#F7C500] relative overflow-hidden">
        {/* Huge decorative 包 watermark */}
        <div className="absolute right-0 top-0 text-[420px] font-black text-[#C8102E]/[0.05] select-none pointer-events-none leading-none -translate-y-16 translate-x-16">
          包
        </div>

        {/* Duo — bottom left, peeking out (desktop only) */}
        <div className="absolute bottom-0 left-0 hidden xl:block pointer-events-none select-none">
          <Image src="/bao/t-duo.png" alt="" width={210} height={210} className="object-contain" />
        </div>

        {/* Trio — top right, mobile only */}
        <div className="absolute top-6 right-0 block lg:hidden pointer-events-none select-none">
          <Image src="/bao/t-trio.png" alt="" width={150} height={150} className="object-contain" />
        </div>

        <div className="max-w-5xl mx-auto px-5 pt-14 pb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">

            {/* Left: text */}
            <div className="flex-1 min-w-0 relative">
              {/* Badge row */}
              <div className="flex flex-wrap items-center gap-2 mb-8">
                {["MCP", "CLAUDE", "SOLANA", "FAIR LAUNCH"].map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-bold text-[#C8102E] px-2 py-0.5 uppercase tracking-widest stamp-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Headline */}
              <h1
                className="font-black uppercase leading-[0.88] tracking-tighter text-[#1A0500]"
                style={{ fontSize: "clamp(52px, 10vw, 96px)" }}
              >
                MINT $BAO
                <br />THROUGH
                <br />CLAUDE
              </h1>

              {/* Outlined subheadline */}
              <p
                className="text-outline font-black uppercase leading-tight tracking-tight mt-4 whitespace-nowrap"
                style={{ fontSize: "clamp(14px, 2.6vw, 30px)" }}
              >
                ONE SIGN. CLAUDE MINTS. 包子.
              </p>

              {/* Description */}
              <p className="text-[#7A4200] text-sm mt-6 max-w-md leading-relaxed">
                sign once to register ur wallet. after that, tell claude{" "}
                <span className="text-[#C8102E] font-bold">"mint me some bao"</span>. the relayer
                ships mint txs on ur behalf. only u get credited. zero trust, max bao, no rug.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3 mt-8">
                <a
                  href="#chat"
                  className="inline-block bg-[#C8102E] text-white font-black uppercase text-sm px-6 py-3 tracking-wide stamp-btn"
                >
                  CHAT WITH CLAUDE →
                </a>
                <WalletButton />
              </div>
            </div>

            {/* Right: trio floating freely — no box */}
            <div className="hidden lg:block flex-shrink-0 -mb-8 -mr-4">
              <Image
                src="/bao/t-trio.png"
                alt="BAOZI trio"
                width={320}
                height={320}
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>

          </div>
        </div>
      </section>

      {/* ── Red Stats Ticker ── */}
      <div className="bg-[#C8102E] text-white py-2 overflow-hidden">
        <div className="flex">
          <div className="animate-marquee whitespace-nowrap flex-shrink-0 text-[11px] font-bold uppercase tracking-widest">
            {TICKER_TEXT.repeat(6)}
          </div>
          <div className="animate-marquee whitespace-nowrap flex-shrink-0 text-[11px] font-bold uppercase tracking-widest" aria-hidden>
            {TICKER_TEXT.repeat(6)}
          </div>
        </div>
      </div>

      {/* ── Chat + Mint ── */}
      <section id="chat" className="bg-[#F7C500] py-12">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <ChatWidget />
            </div>
            <div className="lg:col-span-2">
              <MintPanel />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white border-t-2 border-[#C8102E]/20">
        <HowItWorks />
      </section>

      {/* ── Mint Progress ── */}
      <section className="bg-[#FFF8E1] border-t-2 border-[#C8102E]/20 py-10">
        <div className="max-w-5xl mx-auto px-5">
          <MintProgress />
        </div>
      </section>

      {/* ── Token Info ── */}
      <section className="bg-[#C8102E] py-10">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/60 mb-6">Token Info</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-white/10">
            {TOKEN_INFO.map(([label, value]) => (
              <div key={label} className="bg-[#C8102E] p-4 space-y-1">
                <p className="text-[11px] text-white/60 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Explore the Tech CTA ── */}
      <section className="bg-[#1A0500] py-12">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-6 text-center">Explore the tech</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/how" className="group p-6 stamp-light transition-colors hover:bg-white/5">
              <p className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Deep dive →</p>
              <p className="text-white font-black text-xl uppercase tracking-tight group-hover:text-[#D4AF37] transition-colors">
                HOW IT WORKS
              </p>
              <p className="text-white/40 text-xs mt-2 leading-relaxed">
                MCP · Claude · Partial signing · Relayer · Anchor program
              </p>
            </Link>
            <Link href="/tokenomics" className="group p-6 stamp-light transition-colors hover:bg-white/5">
              <p className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Token economics →</p>
              <p className="text-white font-black text-xl uppercase tracking-tight group-hover:text-[#D4AF37] transition-colors">
                TOKENOMICS
              </p>
              <p className="text-white/40 text-xs mt-2 leading-relaxed">
                Supply · Fixed price · Graduation · Fee structure
              </p>
            </Link>
            <Link href="/receipts" className="group p-6 stamp-light transition-colors hover:bg-white/5">
              <p className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Don&apos;t trust →</p>
              <p className="text-white font-black text-xl uppercase tracking-tight group-hover:text-[#D4AF37] transition-colors">
                RECEIPTS
              </p>
              <p className="text-white/40 text-xs mt-2 leading-relaxed">
                Every claim · On-chain proof · Verify yourself
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#1A0500] border-t border-white/10 py-6 text-center">
        <p className="text-[11px] text-white/40 uppercase tracking-widest">
          $BAO · Fair Launch · 0% Team · LP Fee Share · 100% Mint Fees → Meteora LP
        </p>
      </footer>
    </main>
  );
}
