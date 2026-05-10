import Image from "next/image";

const STEPS = [
  {
    n: "1",
    img: "/bao/t-steamer.png",
    label: "STEP 1",
    title: "SIGN ONCE",
    body: "connect phantom or solflare. sign once to register ur wallet. ~0.002 SOL one-time token account fee, then claude handles the rest. wallet pops once. that's literally it.",
    accent: false,
  },
  {
    n: "2",
    img: "/bao/t-chill.png",
    label: "STEP 2",
    title: "ASK CLAUDE",
    body: 'say "mint me some bao" or "what\'s the price?" or "sell half my tokens". claude figures it out and builds the tx.',
    accent: false,
  },
  {
    n: "3",
    img: "/bao/t-jump.png",
    label: "STEP 3",
    title: "包子 MINTS",
    body: "claude sends the tx back. ur wallet pops once to approve. 250,000 $BAO lands in ur wallet. only u can get credited. no rug.",
    accent: true,
  },
];

export function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-px flex-1 bg-[#C8102E]/20" />
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#7A4200] font-bold">How it works</p>
        <div className="h-px flex-1 bg-[#C8102E]/20" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className={`p-5 space-y-4 stamp ${
              s.accent ? "bg-[#C8102E]" : "bg-white"
            }`}
          >
            {/* Big step number */}
            <div
              className={`text-5xl font-black leading-none ${
                s.accent ? "text-white/20" : "text-[#C8102E]/20"
              }`}
            >
              {s.n}
            </div>

            {/* Baozi image */}
            <Image src={s.img} alt={s.title} width={72} height={72} className="object-contain" />

            {/* Label + title */}
            <div>
              <p
                className={`text-[10px] uppercase tracking-widest mb-1 ${
                  s.accent ? "text-white/60" : "text-[#7A4200]"
                }`}
              >
                {s.label}
              </p>
              <p
                className={`font-black text-base uppercase tracking-tight ${
                  s.accent ? "text-white" : "text-[#1A0500]"
                }`}
              >
                {s.title}
              </p>
            </div>

            <p className={`text-xs leading-relaxed ${s.accent ? "text-white/80" : "text-[#7A4200]"}`}>
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
