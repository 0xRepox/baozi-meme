import Image from "next/image";
import Link from "next/link";
import { WalletButton } from "../components/WalletButton";
import { LivePrice } from "../components/LivePrice";

const PROGRAM_ID = "BBP3vz9Bm4Fx21UZmmWAoykL4shNbTxCrAXtmUrBMEuV";

const FLOW_NODES = [
  { label: "YOUR WALLET", desc: "Phantom / Solflare" },
  { label: "CLAUDE AI", desc: "claude-sonnet-4-6" },
  { label: "MCP SERVER", desc: "mcp.baozi.meme" },
  { label: "RELAYER", desc: "Fee payer + tx builder" },
  { label: "SOLANA PROGRAM", desc: "Anchor on devnet" },
];

const AGENT_LOOP = [
  { n: "1", label: "USER MESSAGE", desc: 'You type: "mint me some bao"' },
  { n: "2", label: "CLAUDE API", desc: "Claude receives your message + wallet context" },
  { n: "3", label: "tool_use: mint_tokens", desc: "Claude calls the mint tool via MCP" },
  { n: "4", label: "RELAYER /mint", desc: "MCP calls POST /mint with wallet + quantity" },
  { n: "5", label: "PARTIAL TX BUILT", desc: "Relayer signs as fee payer, returns unsigned tx" },
  { n: "6", label: "CLAUDE GETS TX", desc: "MCP returns the base64 transaction to Claude" },
  { n: "7", label: "USER APPROVES", desc: "Your wallet popup: sign to approve the mint" },
  { n: "8", label: "DONE ✓", desc: "250,000 $BAO credited to your wallet on-chain" },
];

const ENDPOINTS = [
  { method: "POST", path: "/mint",          desc: "Mint tokens — fixed 0.022 SOL per slot" },
  { method: "GET",  path: "/price",         desc: "Fetch current progress and mint state" },
  { method: "POST", path: "/user/register", desc: "Register wallet (sign once)" },
  { method: "GET",  path: "/user/:wallet",  desc: "Get mints used / remaining for a wallet" },
];

const MCP_TOOLS = [
  { name: "get_price",      desc: "Returns mint progress, slots remaining, and graduation status" },
  { name: "get_user_status", desc: "Returns mints used, remaining, and total SOL spent" },
  { name: "mint_tokens",    desc: "Builds and returns a partial transaction for wallet approval" },
];

export default function HowPage() {
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
            <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-[#7A4200] hover:bg-[#C8102E] hover:text-white px-3 py-1.5 stamp-sm transition-colors">
              HOME
            </Link>
            {[["TOKENOMICS", "/tokenomics"], ["RECEIPTS", "/receipts"]].map(([label, href]) => (
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
      <section className="bg-[#C8102E] text-white py-16 relative overflow-hidden">
        <div className="absolute right-0 top-0 text-[320px] font-black text-white/[0.04] select-none pointer-events-none leading-none -translate-y-8 translate-x-8">
          机
        </div>
        <div className="max-w-5xl mx-auto px-5">
          <Link href="/" className="inline-block text-[11px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors mb-6">
            ← Back to $BAO
          </Link>
          <h1 className="font-black uppercase leading-[0.9] tracking-tighter text-[clamp(36px,7vw,80px)] mb-4">
            HOW THE BAOZI
            <br />MACHINE WORKS
          </h1>
          <p className="text-white/70 text-base font-bold uppercase tracking-widest">
            MCP · CLAUDE · SOLANA · PARTIAL SIGNING
          </p>
        </div>
      </section>

      {/* ── Section 1: Big Picture ── */}
      <section className="bg-[#FFF8E1] py-14">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A4200] mb-3 font-bold">The big picture</p>
          <h2 className="font-black uppercase text-[clamp(24px,5vw,48px)] tracking-tighter leading-tight text-[#1A0500] mb-10">
            YOU TALK. CLAUDE ACTS. 包子 MINTS.
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
            {FLOW_NODES.map((node, i) => (
              <div key={node.label} className="flex items-center gap-2 sm:gap-0 flex-col sm:flex-row">
                <div className="bg-white border-2 border-[#C8102E] p-4 text-center w-full sm:w-auto sm:min-w-[130px]">
                  <p className="font-black text-[11px] uppercase tracking-widest text-[#C8102E] leading-tight">
                    {node.label}
                  </p>
                  <p className="text-[10px] text-[#7A4200] mt-1">{node.desc}</p>
                </div>
                {i < FLOW_NODES.length - 1 && (
                  <span className="text-[#C8102E] font-black text-lg sm:px-2 rotate-90 sm:rotate-0">→</span>
                )}
              </div>
            ))}
          </div>

          <p className="text-[#7A4200] text-sm mt-8 max-w-2xl leading-relaxed">
            The entire system is orchestrated through Claude using the Model Context Protocol.
            Claude doesn&apos;t hold your keys — it can only build transactions that your wallet must
            approve. The relayer pays the gas so you only need SOL for the mint fee itself.
          </p>
        </div>
      </section>

      {/* ── Section 2: Sign Once ── */}
      <section className="bg-white py-14 border-t-2 border-[#C8102E]/20">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A4200] mb-3 font-bold">Step 1</p>
              <h2 className="font-black uppercase text-[clamp(22px,4vw,40px)] tracking-tighter leading-tight text-[#1A0500] mb-6">
                REGISTER (SIGN ONCE)
              </h2>
              <p className="text-[#7A4200] text-sm leading-relaxed mb-4">
                Before Claude can mint on your behalf, you register your wallet on-chain. This
                creates a <span className="font-bold text-[#1A0500]">UserAccount PDA</span> that
                tracks your mints and authorizes the relayer to submit transactions crediting you.
              </p>
              <p className="text-[#7A4200] text-sm leading-relaxed mb-4">
                You sign this transaction once. After that, every mint Claude initiates is
                automatically credited to your registered wallet — you still approve each final tx
                in your wallet.
              </p>
              <p className="text-[#7A4200] text-sm leading-relaxed">
                The relayer covers the SOL for the transaction fee. You pay only the 0.022 SOL
                per actual mint slot, plus a one-time ~0.002 SOL for your token account on first mint.
              </p>
            </div>

            <div className="bg-[#1A0500] p-5 font-mono text-sm">
              <p className="text-[#D4AF37] text-[10px] uppercase tracking-widest mb-3">On-chain registration</p>
              <div className="space-y-1.5 text-xs">
                <p className="text-[#7A7070]">// Instruction: register_user</p>
                <p className="text-white">accounts: {"{"}</p>
                <p className="text-[#FFF8E1] pl-4">user: <span className="text-[#C8102E]">Signer</span>,</p>
                <p className="text-[#FFF8E1] pl-4">user_account: <span className="text-[#C8102E]">PDA</span>,</p>
                <p className="text-[#FFF8E1] pl-4">system_program: SystemProgram,</p>
                <p className="text-white">{"}"}</p>
                <div className="h-px bg-white/10 my-3" />
                <p className="text-[#7A7070]">// UserAccount PDA seeds</p>
                <p className="text-[#D4AF37]">[b&quot;user_account&quot;, wallet.key()]</p>
                <div className="h-px bg-white/10 my-3" />
                <p className="text-[#7A7070]">// Stored fields</p>
                <p className="text-white">mints_used: <span className="text-[#C8102E]">0</span></p>
                <p className="text-white">max_mints: <span className="text-[#C8102E]">10</span></p>
                <p className="text-white">total_spent: <span className="text-[#C8102E]">0</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Claude's Tool Loop ── */}
      <section className="bg-[#F7C500] py-14 border-t-2 border-[#C8102E]/20">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A4200] mb-3 font-bold">Agentic loop</p>
          <h2 className="font-black uppercase text-[clamp(22px,4vw,40px)] tracking-tighter leading-tight text-[#1A0500] mb-10">
            HOW CLAUDE MINTS FOR YOU
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AGENT_LOOP.map((step) => (
              <div key={step.n} className="bg-white border-2 border-[#C8102E] p-4 space-y-3">
                <div className="text-4xl font-black text-[#C8102E]/20 leading-none">{step.n}</div>
                <p className="font-black text-[11px] uppercase tracking-wider text-[#C8102E] leading-tight">
                  {step.label}
                </p>
                <p className="text-xs text-[#7A4200] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: The Relayer ── */}
      <section className="bg-white py-14 border-t-2 border-[#C8102E]/20">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A4200] mb-3 font-bold">Infrastructure</p>
          <h2 className="font-black uppercase text-[clamp(22px,4vw,40px)] tracking-tighter leading-tight text-[#1A0500] mb-6">
            THE RELAYER: GAS-FREE UX
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-[#7A4200] text-sm leading-relaxed mb-4">
                The relayer is a Node.js server that holds a funded keypair and acts as the
                <span className="font-bold text-[#1A0500]"> fee payer</span> for every transaction.
                This is called <span className="font-bold text-[#1A0500]">partial signing</span>:
                the relayer signs first, then passes the transaction back to the user for their
                buyer signature.
              </p>
              <p className="text-[#7A4200] text-sm leading-relaxed mb-6">
                The relayer cannot steal funds. It signs as fee payer only — the program requires
                the registered user to also sign. Two signatures are mandatory; one is not enough.
              </p>

              <div className="space-y-2">
                {ENDPOINTS.map((ep) => (
                  <div key={ep.path} className="flex items-center gap-3 p-3 bg-[#FFF8E1] border border-[#C8102E]/20">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-[#C8102E] text-white px-2 py-0.5 w-12 text-center flex-shrink-0">
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs text-[#C8102E] font-bold flex-shrink-0">{ep.path}</span>
                    <span className="text-[11px] text-[#7A4200]">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1A0500] p-5 font-mono text-xs">
              <p className="text-[#D4AF37] text-[10px] uppercase tracking-widest mb-3">Partial signing flow</p>
              <div className="space-y-1.5">
                <p className="text-[#7A7070]">// 1. Relayer builds transaction</p>
                <p className="text-white">const tx = new Transaction()</p>
                <p className="text-white pl-2">.add(mintInstruction)</p>
                <div className="h-px bg-white/10 my-2" />
                <p className="text-[#7A7070]">// 2. Relayer signs as feePayer</p>
                <p className="text-white">tx.partialSign(relayerKeypair)</p>
                <div className="h-px bg-white/10 my-2" />
                <p className="text-[#7A7070]">// 3. Return base64 to Claude</p>
                <p className="text-[#D4AF37]">return tx.serialize({"{"}</p>
                <p className="text-[#D4AF37] pl-2">requireAllSignatures: false</p>
                <p className="text-[#D4AF37]">{"}"}).toString(&quot;base64&quot;)</p>
                <div className="h-px bg-white/10 my-2" />
                <p className="text-[#7A7070]">// 4. User signs buyer side</p>
                <p className="text-[#006064]">signTransaction(tx) // wallet popup</p>
                <div className="h-px bg-white/10 my-2" />
                <p className="text-[#7A7070]">// 5. Submit fully signed tx</p>
                <p className="text-white">connection.sendRawTransaction(</p>
                <p className="text-white pl-2">signed.serialize()</p>
                <p className="text-white">)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: On-Chain Program ── */}
      <section className="bg-[#FFF8E1] py-14 border-t-2 border-[#C8102E]/20">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A4200] mb-3 font-bold">Solana</p>
          <h2 className="font-black uppercase text-[clamp(22px,4vw,40px)] tracking-tighter leading-tight text-[#1A0500] mb-6">
            ANCHOR PROGRAM ON SOLANA
          </h2>

          <div className="bg-white border-2 border-[#C8102E] p-4 mb-8 inline-block">
            <p className="text-[10px] uppercase tracking-widest text-[#7A4200] mb-1">Program ID</p>
            <p className="font-mono text-sm font-bold text-[#C8102E] break-all">{PROGRAM_ID}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {[
              {
                name: "MintState PDA",
                seeds: '[b"mint_state", mint.key()]',
                desc: "Tracks total slots minted, graduation status, and authority. Mint authority for all $BAO.",
              },
              {
                name: "UserAccount PDA",
                seeds: '[b"user_account", wallet]',
                desc: "Tracks mints used, mints remaining, and total SOL spent per wallet.",
              },
              {
                name: "Token Mint",
                seeds: "keypair (generated at init)",
                desc: "The $BAO SPL token. Mint authority is the MintState PDA — only the program can mint.",
              },
            ].map((acct) => (
              <div key={acct.name} className="bg-white border-2 border-[#C8102E]/30 p-4">
                <p className="font-black text-sm uppercase tracking-tight text-[#1A0500] mb-1">{acct.name}</p>
                <p className="font-mono text-[10px] text-[#C8102E] mb-2">{acct.seeds}</p>
                <p className="text-xs text-[#7A4200] leading-relaxed">{acct.desc}</p>
              </div>
            ))}
          </div>

          {/* Fixed price box */}
          <div className="bg-[#C8102E] p-6 text-center">
            <p className="text-[11px] uppercase tracking-widest text-white/60 mb-3">Pricing model</p>
            <p className="font-black text-white text-[clamp(20px,4vw,36px)] font-mono tracking-tight">
              0.022 SOL = 250,000 $BAO
            </p>
            <p className="text-white/70 text-sm mt-3">
              Fixed price. No bonding curve. No slippage. No AMM.
            </p>
            <p className="text-white/70 text-sm mt-1">
              Every slot costs exactly the same — first or last.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 6: The MCP Bridge ── */}
      <section className="bg-[#C8102E] text-white py-14">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/60 mb-3 font-bold">Protocol</p>
          <h2 className="font-black uppercase text-[clamp(22px,4vw,40px)] tracking-tighter leading-tight mb-6">
            MODEL CONTEXT PROTOCOL
          </h2>

          <p className="text-white/80 text-sm leading-relaxed max-w-2xl mb-4">
            Claude uses MCP tools natively through the Anthropic API. No browser extension,
            no plugin, no third-party wallet. The MCP server runs at{" "}
            <span className="font-mono font-bold bg-white/10 px-1">mcp.baozi.meme</span> and
            exposes typed tools Claude calls during a conversation.
          </p>
          <p className="text-white/80 text-sm leading-relaxed max-w-2xl mb-10">
            When Claude decides to mint, it emits a{" "}
            <span className="font-mono font-bold bg-white/10 px-1">tool_use</span> block.
            The MCP server intercepts this, calls the relayer, and returns the transaction as a{" "}
            <span className="font-mono font-bold bg-white/10 px-1">tool_result</span>. Claude
            then surfaces it to you to approve in your wallet.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {MCP_TOOLS.map((tool) => (
              <div key={tool.name} className="bg-white/10 border border-white/20 p-4">
                <p className="font-mono font-black text-sm mb-2">{tool.name}</p>
                <p className="text-white/70 text-xs leading-relaxed">{tool.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white/10 border border-white/20 p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/60 mb-2">Connect your Claude</p>
            <p className="font-mono text-xs text-white break-all">
              {`{ "mcpServers": { "baozi": { "type": "http", "url": "https://mcp.baozi.meme" } } }`}
            </p>
            <p className="text-white/50 text-[11px] mt-2">Add to claude_desktop_config.json — then just talk to Claude.</p>
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
