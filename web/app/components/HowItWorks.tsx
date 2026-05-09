import Image from "next/image";

const STEPS = [
  {
    n: "1",
    img: "/bao/steamer.jpeg",
    alt: "Baozi in steamer",
    title: "Connect & Register",
    body: "Connect Phantom or Solflare. Sign once to register your wallet — the relayer covers the fee.",
  },
  {
    n: "2",
    img: "/bao/chill.jpeg",
    alt: "Chill baozi",
    title: "Ask Claude",
    body: 'Type anything: "mint me some BAO", "what\'s the price?", "sell half my tokens". Claude handles it.',
  },
  {
    n: "3",
    img: "/bao/jump.jpeg",
    alt: "Jumping baozi",
    title: "Approve in Wallet",
    body: "Claude builds the transaction and sends it back. One click to approve in your wallet. Done.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-border px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 text-center mb-10">
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div key={s.n} className="space-y-4">
              {/* Baozi image */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-1 ring-white/5">
                <Image
                  src={s.img}
                  alt={s.alt}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Step number + title */}
              <div className="space-y-1">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest">Step {s.n}</p>
                <p className="font-semibold text-white text-sm">{s.title}</p>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
