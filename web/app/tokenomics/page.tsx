import Image from "next/image";
import Link from "next/link";
import { BondingCurveChart } from "../components/BondingCurveChart";
import { WalletButton } from "../components/WalletButton";
import { LivePrice } from "../components/LivePrice";

const MINT_STATS = [
  { label: "Per Mint", value: "250,000 $BAO" },
  { label: "Cost per Mint", value: "0.022 SOL" },
  { label: "Max per Wallet", value: "10 mints" },
  { label: "Total Mints", value: "20,000" },
];

const GRADUATION_STEPS = [
  {
    step: "1",
    label: "MINT",
    desc: "Users mint $BAO through Claude. Each mint is 250,000 tokens for 0.022 SOL. SOL accumulates in the bonding curve.",
  },
  {
    step: "2",
    label: "BOND",
    desc: "Price rises along the x*y=k curve as more SOL flows in. Every mint increases the price for the next buyer — fair discovery.",
  },
  {
    step: "3",
    label: "GRADUATE",
    desc: "At 85 SOL raised, the 5B LP reserve tokens + all raised SOL are sent to Meteora as liquidity. Pool locked. No rug possible.",
  },
];

export default function TokenomicsPage() {
  return (
    <main className="min-h-screen bg-[#F7C500] text-[#1A0500]">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b-4 border-[#C8102E] bg-white">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-[#F7C500] stamp-sm px-3 py-1.5">
            <Image src="/bao/t-chill.png" alt="BAO" width={24} height={24} />
            <span className="font-black text-sm tracking-tight uppercase text-[#1A0500]">
              包子 <span className="text-[#C8102E]">$BAO</span>
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6">
            <Link
              href="/"
              className="text-[11px] font-bold uppercase tracking-widest text-[#7A4200] hover:bg-[#C8102E] hover:text-white px-3 py-1.5 stamp-sm transition-colors"
            >
              HOME
            </Link>
            {[["HOW IT WORKS", "/how"], ["RECEIPTS", "/receipts"]].map(([label, href]) => (
              <Link key={href} href={href}
                className="text-[11px] font-bold uppercase tracking-widest text-[#7A4200] hover:bg-[#C8102E] hover:text-white px-3 py-1.5 stamp-sm transition-colors">
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <LivePrice />
            <WalletButton />
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-[#F7C500] py-16 relative overflow-hidden">
        <div className="absolute right-0 top-0 text-[360px] font-black text-[#C8102E]/[0.05] select-none pointer-events-none leading-none -translate-y-12 translate-x-12">
          币
        </div>
        <div className="max-w-5xl mx-auto px-5">
          <Link
            href="/"
            className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#7A4200] hover:text-[#C8102E] transition-colors mb-6"
          >
            ← Back to $BAO
          </Link>
          <h1
            className="font-black uppercase leading-[0.88] tracking-tighter text-[#1A0500]"
            style={{ fontSize: "clamp(48px,9vw,96px)" }}
          >
            TOKENOMICS
          </h1>
          <p className="text-[#C8102E] font-black text-base uppercase tracking-widest mt-4">
            FAIR LAUNCH. 0% TEAM. 包子 FOR EVERYONE.
          </p>
        </div>
      </section>

      {/* ── Section 1: Supply Distribution ── */}
      <section className="bg-white py-14 border-t-2 border-[#C8102E]/20">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A4200] mb-3 font-bold">Supply</p>
          <h2 className="font-black uppercase text-[clamp(20px,4vw,40px)] tracking-tighter leading-tight text-[#1A0500] mb-10">
            10,000,000,000 $BAO TOTAL SUPPLY
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {/* Public Mint card */}
            <div className="border-2 border-[#C8102E] p-6 space-y-4">
              <span className="inline-block bg-[#C8102E] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1">
                PUBLIC MINT
              </span>
              <p className="font-black text-[clamp(24px,4vw,40px)] text-[#1A0500] leading-tight tracking-tight">
                5,000,000,000
              </p>
              <p className="text-[#7A4200] text-sm font-bold">50% of total supply</p>
              <p className="text-[#7A4200] text-xs leading-relaxed">
                All minted through Claude. 20,000 individual mints of 250,000 tokens each.
                Price rises with each mint via the bonding curve.
              </p>
            </div>

            {/* LP Reserve card */}
            <div className="border-2 border-[#006064] p-6 space-y-4">
              <span className="inline-block bg-[#006064] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1">
                LP RESERVE
              </span>
              <p className="font-black text-[clamp(24px,4vw,40px)] text-[#1A0500] leading-tight tracking-tight">
                5,000,000,000
              </p>
              <p className="text-[#7A4200] text-sm font-bold">50% of total supply</p>
              <p className="text-[#7A4200] text-xs leading-relaxed">
                Reserved for Meteora liquidity at graduation. Paired with 85 SOL raised.
                LP is locked — no rug pull possible.
              </p>
            </div>
          </div>

          {/* Zero team callout */}
          <div className="bg-[#FFF8E1] border-l-4 border-[#C8102E] p-5">
            <p className="font-black text-[#1A0500] text-base uppercase tracking-tight">
              0 tokens to team. 0 insider allocation.
            </p>
            <p className="text-[#7A4200] text-sm mt-1">
              All $BAO is minted through Claude at market price. No presale. No seed round.
              No dev wallet.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 2: Mint Mechanics ── */}
      <section className="bg-[#FFF8E1] py-14 border-t-2 border-[#C8102E]/20">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A4200] mb-3 font-bold">Mechanics</p>
          <h2 className="font-black uppercase text-[clamp(20px,4vw,40px)] tracking-tighter leading-tight text-[#1A0500] mb-8">
            MINT MECHANICS
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {MINT_STATS.map((stat) => (
              <div key={stat.label} className="bg-white border-2 border-[#C8102E] p-4 text-center">
                <p className="text-[10px] uppercase tracking-widest text-[#7A4200] mb-2">{stat.label}</p>
                <p className="font-black text-sm text-[#C8102E] leading-tight">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border-2 border-[#C8102E]/30 p-6">
            <p className="text-[#7A4200] text-sm leading-relaxed mb-3">
              Each mint is <span className="font-bold text-[#1A0500]">250,000 tokens</span> for{" "}
              <span className="font-bold text-[#1A0500]">0.022 SOL</span>. All mint fees go
              directly into the bonding curve escrow — at graduation, 100% flows into the
              Meteora DLMM liquidity pool. Dev receives nothing from mints.
            </p>
            <p className="text-[#7A4200] text-sm leading-relaxed">
              The <span className="font-bold text-[#1A0500]">10 mints per wallet</span> cap ensures
              no single wallet can accumulate a disproportionate share. Max wallet bag:{" "}
              <span className="font-bold text-[#1A0500]">2,500,000 $BAO</span> (0.025% of supply).
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 3: Bonding Curve ── */}
      <section className="bg-[#C8102E] text-white py-14">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/60 mb-3 font-bold">Pricing</p>
          <h2 className="font-black uppercase text-[clamp(20px,4vw,40px)] tracking-tighter leading-tight mb-6">
            x*y=k BONDING CURVE
          </h2>

          <div className="bg-white/10 border border-white/20 p-6 text-center mb-8">
            <p className="text-[11px] uppercase tracking-widest text-white/60 mb-3">Price formula</p>
            <p className="font-mono font-black text-white text-[clamp(18px,3.5vw,32px)]">
              P = virtual_SOL_reserves / virtual_token_reserves
            </p>
            <div className="flex flex-col sm:flex-row gap-6 mt-6 text-center">
              <div className="flex-1">
                <p className="text-white/60 text-[10px] uppercase tracking-widest mb-1">Starting price</p>
                <p className="font-black text-white text-lg">~0.000000022 SOL</p>
              </div>
              <div className="w-px bg-white/20 hidden sm:block" />
              <div className="flex-1">
                <p className="text-white/60 text-[10px] uppercase tracking-widest mb-1">Graduation trigger</p>
                <p className="font-black text-white text-lg">85 SOL raised</p>
              </div>
              <div className="w-px bg-white/20 hidden sm:block" />
              <div className="flex-1">
                <p className="text-white/60 text-[10px] uppercase tracking-widest mb-1">Curve type</p>
                <p className="font-black text-white text-lg">Constant Product</p>
              </div>
            </div>
          </div>

          {/* Chart embedded */}
          <div className="bg-white p-2">
            <BondingCurveChart />
          </div>
        </div>
      </section>

      {/* ── Section 4: Road to Meteora ── */}
      <section className="bg-white py-14 border-t-2 border-[#C8102E]/20">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A4200] mb-3 font-bold">Graduation</p>
          <h2 className="font-black uppercase text-[clamp(20px,4vw,40px)] tracking-tighter leading-tight text-[#1A0500] mb-10">
            GRADUATION AT 85 SOL
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {GRADUATION_STEPS.map((s, i) => (
              <div key={s.step} className="relative">
                <div className="bg-[#FFF8E1] border-2 border-[#C8102E]/30 p-5 h-full">
                  <div className="text-5xl font-black text-[#C8102E]/15 leading-none mb-3">{s.step}</div>
                  <p className="font-black text-lg uppercase tracking-tight text-[#C8102E] mb-3">{s.label}</p>
                  <p className="text-xs text-[#7A4200] leading-relaxed">{s.desc}</p>
                </div>
                {i < GRADUATION_STEPS.length - 1 && (
                  <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-[#C8102E] font-black text-xl">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-[#1A0500] p-6 text-white">
            <p className="font-black uppercase tracking-tight text-base mb-2">What happens at graduation:</p>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex gap-2">
                <span className="text-[#C8102E] font-bold flex-shrink-0">1.</span>
                The 5,000,000,000 LP reserve tokens are released from the program.
              </li>
              <li className="flex gap-2">
                <span className="text-[#C8102E] font-bold flex-shrink-0">2.</span>
                All 85 SOL raised through the bonding curve is moved.
              </li>
              <li className="flex gap-2">
                <span className="text-[#C8102E] font-bold flex-shrink-0">3.</span>
                Tokens + SOL are deposited into a Meteora AMM pool as liquidity.
              </li>
              <li className="flex gap-2">
                <span className="text-[#C8102E] font-bold flex-shrink-0">4.</span>
                The LP tokens are locked. Liquidity cannot be removed. No rug.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Section 5: Fee Structure ── */}
      <section className="bg-[#FFF8E1] py-14 border-t-2 border-[#C8102E]/20">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A4200] mb-3 font-bold">Fees</p>
          <h2 className="font-black uppercase text-[clamp(20px,4vw,40px)] tracking-tighter leading-tight text-[#1A0500] mb-8">
            FEE STRUCTURE
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border-2 border-[#C8102E] p-6 text-center">
              <p className="text-[10px] uppercase tracking-widest text-[#7A4200] mb-2">Trading fee</p>
              <p className="font-black text-4xl text-[#C8102E]">1%</p>
              <p className="text-xs text-[#7A4200] mt-2">On all buys and sells via bonding curve</p>
            </div>
            <div className="bg-white border-2 border-[#C8102E]/30 p-6 text-center">
              <p className="text-[10px] uppercase tracking-widest text-[#7A4200] mb-2">Dev wallet</p>
              <p className="font-black text-4xl text-[#1A0500]">0%</p>
              <p className="text-xs text-[#7A4200] mt-2">No dev allocation. No insider wallet.</p>
            </div>
            <div className="bg-white border-2 border-[#C8102E]/30 p-6 text-center">
              <p className="text-[10px] uppercase tracking-widest text-[#7A4200] mb-2">Fee destination</p>
              <p className="font-black text-lg text-[#1A0500] leading-tight mt-2">Treasury</p>
              <p className="text-xs text-[#7A4200] mt-2">Fees fund relayer operations and future development</p>
            </div>
          </div>

          <p className="text-[#7A4200] text-sm leading-relaxed mt-8 max-w-2xl">
            Zero protocol fee during the bonding curve phase. All 0.022 SOL per mint goes
            directly to the Meteora LP at graduation. Dev earns only Meteora LP fee share
            from trading activity after graduation — no other revenue stream.
          </p>
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
