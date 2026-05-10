import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, stepCountIs, tool } from "ai";
import { NextRequest } from "next/server";
import { z } from "zod";

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the minting assistant for BAOZI ($BAO) on Solana.

Rules — follow exactly:
- Max 2 sentences per reply. No headers. No lists. No emoji.
- Act immediately. Never ask "how many?" or "are you sure?" — just do it.
- "mint" or "mint 3" or "mint me some bao" → call mint_tokens right now with that quantity (default 1).
- "mint all" or "mint max" → use remaining mints as quantity.
- When mint_tokens returns transactionReady, say exactly: "transaction ready — approve in your wallet." Nothing else.
- Never reconfirm, never summarise what you just did.
- Cost is 0.022 SOL per slot, 250,000 $BAO per slot, max 10 slots per wallet.
- If mints remaining is 0, say so in one sentence and stop.
- Never mention dollars or fees.`;

export async function POST(req: NextRequest) {
  const { messages, wallet } = await req.json();

  if (!wallet) {
    return Response.json({ error: "Connect your wallet first" }, { status: 400 });
  }

  const RELAYER = process.env.RELAYER_URL ?? "http://localhost:3001";
  let pendingTransaction: string | undefined;

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM_PROMPT,
    stopWhen: stepCountIs(5),
    messages: [
      {
        role: "user",
        content: `My wallet: ${wallet}\n\n${messages[messages.length - 1].content}`,
      },
    ],
    tools: {
      get_price: tool({
        description: "Get current $BAO price and bonding curve status",
        inputSchema: z.object({}),
        execute: async () => {
          const r = await fetch(`${RELAYER}/price`);
          return r.json();
        },
      }),

      get_user_status: tool({
        description: "Check mints used/remaining for the connected wallet",
        inputSchema: z.object({ wallet: z.string() }),
        execute: async () => {
          const r = await fetch(`${RELAYER}/user/${wallet}`);
          return r.json();
        },
      }),

      mint_tokens: tool({
        description: "Mint $BAO — 250,000 tokens per slot, 0.022 SOL per slot, up to 10 at once",
        inputSchema: z.object({
          quantity: z.number().int().min(1).max(10).default(1)
            .describe("Number of mint slots (1–10)"),
        }),
        execute: async ({ quantity }) => {
          const r = await fetch(`${RELAYER}/buy`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet, quantity }),
          });
          const d = await r.json();
          if (d.transaction) {
            pendingTransaction = d.transaction;
            const { transaction: _, ...rest } = d;
            return { ...rest, transactionReady: true };
          }
          return d;
        },
      }),

      sell_tokens: tool({
        description: "Sell $BAO tokens back to the bonding curve",
        inputSchema: z.object({
          amount: z.number().positive()
            .describe("Token amount with 6 decimals, e.g. 250000000000 for 250,000 tokens"),
        }),
        execute: async ({ amount }) => {
          const r = await fetch(`${RELAYER}/sell`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet, tokenAmount: amount }),
          });
          const d = await r.json();
          if (d.transaction) {
            pendingTransaction = d.transaction;
            const { transaction: _, ...rest } = d;
            return { ...rest, transactionReady: true };
          }
          return d;
        },
      }),
    },
  });

  return Response.json({ reply: text, transaction: pendingTransaction });
}
