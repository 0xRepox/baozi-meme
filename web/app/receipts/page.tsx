import Image from "next/image";
import Link from "next/link";
import { WalletButton } from "../components/WalletButton";
import { LivePrice } from "../components/LivePrice";
import { MintStatePanel } from "../components/MintStatePanel";

const PROGRAM_ID = "BBP3vz9Bm4Fx21UZmmWAoykL4shNbTxCrAXtmUrBMEuV";

const PILLARS = [
  {
    n: "1",
    label: "PILLAR 1",
    title: "PARTIAL SIGNING",
    body: "Users sign once to register. Claude mints on your behalf via MCP. Relayer covers gas. Contract enforces recipient == caller — only your wallet gets the tokens. Every mint traceable on-chain.",
    accent: false,
  },
  {
    n: "2",
    label: "PILLAR 2",
    title: "FAIR LAUNCH",
    body: "No presale. 0% team. All mint fees go 100% to Meteora LP — locked 1 year. Dev earns LP fee share only. 0 retained.",
    accent: true,
  },
  {
    n: "3",
    label: "PILLAR 3",
    title: "CLAUDE NATIVE",
    body: "Claude mints on your behalf via MCP server. Relayer broadcasts the tx. Contract enforces recipient = caller. Every mint permanently on Solana.",
    accent: false,
  },
];

const CLAIMS = [
  { label: "No presale", desc: "0 tokens distributed before public mint opened. Enforced by contract — mint requires registered wallet, no backdoor." },
  { label: "0% team allocation", desc: "Team retains 0 $BAO. No team mint in the program. Verifiable by reading the Anchor program." },
  { label: "100% mint fees → Meteora LP", desc: "All SOL from mints goes directly to the treasury address at mint time — no escrow, no delay. Dev will add 100% to Meteora DLMM pool at graduation. Verifiable: every mint tx shows SOL transfer to treasury." },
  { label: "LP locked 1 year", desc: "Meteora DLMM lockReleasePoint set 1 year from graduation. LP position publicly verifiable on Meteora." },
  { label: "LP fee share only", desc: "Dev earns zero from mints. Zero protocol fee on trades. Only revenue = Meteora LP fee share from trading activity after graduation." },
  { label: "Contract is immutable", desc: "No upgrade authority on the deployed program. What's deployed is what runs — forever." },
  { label: "Max 10 mints per wallet", desc: "UserAccount.mints_used checked on-chain before every mint. Enforced by the Anchor program, not just the UI." },
  { label: "Recipient == caller", desc: "The relayer builds the tx but tokens always credited to the user's registered wallet. Contract enforces this — relayer cannot redirect tokens." },
];

const MCP_TOOLS = [
  { name: "get_price", desc: "Current mint progress, slots remaining, and live stats" },
  { name: "get_user_status", desc: "Mints used, remaining slots, wallet bag" },
  { name: "mint_tokens", desc: "Builds partial tx — returns to Claude for wallet approval" },
];

export default function ReceiptsPage() {
  return (
    <main className="min-h-screen bg-[#F7C500] text-[#1A0500]">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b-4 border-[#C8102E] bg-white">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 bg-[#F7C500] stamp-sm px-3 py-1.5">
            <Image src="/bao/t-chill.png" alt="BAO" width={24} height={24} />
            <span className="font-black text-sm tracking-tight uppercase text-[#1A0500]">
              包子 <span className="text-[#C8102E]">$BAO</span>
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6">
            {[["HOME", "/"], ["HOW IT WORKS", "/how"], ["TOKENOMICS", "/tokenomics"]].map(([label, href]) => (
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
      <section className="bg-[#1A0500] py-14">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex items-start gap-4 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 mt-1">Don&apos;t trust.</span>
            <span className="inline-block bg-[#C8102E] text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1 stamp-sm">VERIFY ✓</span>
          </div>
          <h1 className="font-black uppercase leading-none tracking-tighter text-white"
            style={{ fontSize: "clamp(64px, 12vw, 120px)" }}>
            RECEIPTS
          </h1>
          <p className="text-white/50 text-sm mt-4 max-w-lg leading-relaxed font-mono">
            every claim about $BAO mapped to its on-chain receipt. verifiable in one click. no trust required.
          </p>
        </div>
      </section>

      {/* ── Three Pillars ── */}
      <section className="bg-[#F7C500] py-12 border-b-2 border-[#C8102E]/20">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#7A4200] font-bold mb-6">— THREE PILLARS —</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PILLARS.map((p) => (
              <div key={p.n} className={`p-5 stamp space-y-3 ${p.accent ? "bg-[#C8102E]" : "bg-white"}`}>
                <div className={`text-[10px] uppercase tracking-widest font-bold ${p.accent ? "text-white/60" : "text-[#7A4200]"}`}>
                  {p.label}
                </div>
                <div className={`text-4xl font-black leading-none ${p.accent ? "text-white/20" : "text-[#C8102E]/20"}`}>
                  {p.n}
                </div>
                <p className={`font-black text-base uppercase tracking-tight ${p.accent ? "text-white" : "text-[#1A0500]"}`}>
                  {p.title}
                </p>
                <p className={`text-xs leading-relaxed ${p.accent ? "text-white/80" : "text-[#7A4200]"}`}>
                  {p.body}
                </p>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${p.accent ? "text-white" : "text-[#C8102E]"}`}>
                  {p.n === "1" ? "PARTIAL SIGN ✓" : p.n === "2" ? "0% RETAINED ✓" : "CLAUDE-NATIVE ✓"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core Contracts ── */}
      <section className="bg-white py-10 border-b-2 border-[#C8102E]/20">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#7A4200] font-bold mb-6">— CORE CONTRACTS —</p>
          <div className="stamp bg-[#1A0500] p-6 space-y-4">
            {[
              { label: "program (launchpad)", value: PROGRAM_ID },
              { label: "chain", value: "Solana devnet" },
              { label: "lp pool", value: "Meteora DLMM — set at graduation" },
              { label: "lp lock", value: "Meteora lockReleasePoint — 1 year" },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0">
                <span className="text-[11px] uppercase tracking-widest text-white/40 sm:w-48 flex-shrink-0">{label}</span>
                <span className="font-mono text-xs text-white break-all">{value}</span>
                {label === "program (launchpad)" && (
                  <a
                    href={`https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[10px] font-bold uppercase tracking-widest text-[#C8102E] hover:text-[#F7C500] flex-shrink-0"
                  >
                    VERIFIED →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fair Launch Claims ── */}
      <section className="bg-[#F7C500] py-10 border-b-2 border-[#C8102E]/20">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#7A4200] font-bold mb-6">— FAIR LAUNCH RECEIPTS —</p>
          <div className="bg-[#1A0500] stamp p-6 space-y-0">
            <p className="text-[11px] uppercase tracking-widest text-white/40 mb-5">
              every claim has a tx — verifiable on-chain
            </p>
            {CLAIMS.map((c, i) => (
              <div key={i} className="flex gap-4 py-4 border-b border-white/10 last:border-0">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-5 h-5 bg-[#C8102E] flex items-center justify-center">
                    <span className="text-white text-[10px] font-black">✓</span>
                  </div>
                </div>
                <div>
                  <p className="text-white font-black text-sm uppercase tracking-tight">{c.label}</p>
                  <p className="text-white/50 text-xs mt-1 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mint State ── */}
      <section className="bg-white py-10 border-b-2 border-[#C8102E]/20">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#7A4200] font-bold">— MINT STATE —</p>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#C8102E] px-2 py-0.5 stamp-sm">
              LIVE
            </span>
          </div>
          <MintStatePanel />
        </div>
      </section>

      {/* ── AI Integration ── */}
      <section className="bg-[#F7C500] py-10 border-b-2 border-[#C8102E]/20">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#7A4200] font-bold mb-6">— AI INTEGRATION —</p>
          <div className="bg-white stamp p-6 space-y-4">
            {[
              { label: "mcp endpoint", value: "https://mcp.baozi.meme" },
              { label: "protocol", value: "MCP over HTTP + SSE" },
              { label: "model", value: "claude-sonnet-4-6" },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 border-b border-[#1A0500]/10 pb-4 last:border-0 last:pb-0">
                <span className="text-[11px] uppercase tracking-widest text-[#7A4200] sm:w-36 flex-shrink-0">{label}</span>
                <span className="font-mono text-xs text-[#1A0500] break-all">{value}</span>
              </div>
            ))}
            <div className="pt-2">
              <p className="text-[11px] uppercase tracking-widest text-[#7A4200] mb-3">tools available</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MCP_TOOLS.map((t) => (
                  <div key={t.name} className="flex gap-3 p-3 bg-[#FFF8E1] stamp-sm">
                    <span className="text-[#C8102E] font-black text-xs flex-shrink-0">{t.name}</span>
                    <span className="text-[#7A4200] text-xs">— {t.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Verify Yourself ── */}
      <section className="bg-[#1A0500] py-10 border-b-2 border-white/10">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex items-center gap-3 mb-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 font-bold">— VERIFY YOURSELF —</p>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#C8102E] px-2 py-0.5 stamp-sm border-[#C8102E]">NO TRUST</span>
          </div>
          <div className="space-y-4">
            {[
              {
                label: "mint slots used",
                cmd: `curl https://relayer.baozi.meme/price`,
                note: "→ totalMinted and slotsRemaining from MintState PDA",
              },
              {
                label: "program is immutable",
                cmd: `solana program show ${PROGRAM_ID} --url devnet`,
                note: "→ upgrade authority should be none",
              },
              {
                label: "lp pool locked",
                cmd: "check Meteora pool page after graduation",
                note: "→ lockReleasePoint timestamp verifiable on Meteora",
              },
            ].map((v, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-4 space-y-2">
                <p className="text-[11px] uppercase tracking-widest text-white/40">{v.label}</p>
                <code className="block text-xs font-mono text-[#F7C500] break-all">{v.cmd}</code>
                <p className="text-[11px] text-white/40 font-mono">{v.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Share ── */}
      <section className="bg-[#1A0500] py-10">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 font-bold mb-4">— SHARE THIS PAGE —</p>
          <div className="space-y-2">
            {[
              ["is $BAO legit?", "→ send them here"],
              ["is the LP locked?", "→ send them here"],
              ["does dev hold tokens?", "→ send them here"],
            ].map(([q, a]) => (
              <div key={q} className="flex items-center gap-3 text-xs">
                <div className="w-4 h-4 bg-[#C8102E] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[9px] font-black">✓</span>
                </div>
                <span className="text-white/60">when someone asks <span className="text-white font-bold">&ldquo;{q}&rdquo;</span> {a}</span>
              </div>
            ))}
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
