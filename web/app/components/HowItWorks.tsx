const STEPS = [
  {
    n: "1",
    title: "Connect & Register",
    body: "Connect Phantom or Solflare. Sign once to register your wallet — the relayer covers the fee.",
  },
  {
    n: "2",
    title: "Ask Claude",
    body: 'Type anything: "mint me some BAO", "what\'s the price?", "sell half my tokens". Claude handles it.',
  },
  {
    n: "3",
    title: "Approve in Wallet",
    body: "Claude builds the transaction and sends it back. You approve with one click in your wallet.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-border px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 text-center mb-8">
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div key={s.n} className="space-y-3">
              <div className="w-8 h-8 rounded-full border border-brand flex items-center justify-center text-brand text-xs font-bold">
                {s.n}
              </div>
              <p className="font-semibold text-white text-sm">{s.title}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
