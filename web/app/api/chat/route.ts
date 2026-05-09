import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the minting assistant for this Solana token launchpad.

You help users:
- Check the current token price and bonding curve progress
- Check their mint status (how many mints used / remaining)
- Mint tokens ($2 per mint, 250,000 tokens each, max 10 per wallet)
- Sell tokens back to the bonding curve

Rules:
- Always check user status before minting
- Never mint without confirming the user understands the $2 cost
- Be concise and clear — one or two sentences max unless showing data
- Use the tools available to you to take real actions
- If a user has 0 mints remaining, tell them clearly and offer to check price or sell
- When mint_tokens returns a transaction, tell the user to approve it in their wallet

Personality: friendly, direct, no fluff. Meme-aware but not cringe.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_price",
    description: "Get current token price and bonding curve status",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_user_status",
    description: "Check mints used/remaining for the connected wallet",
    input_schema: {
      type: "object",
      properties: { wallet: { type: "string" } },
      required: ["wallet"],
    },
  },
  {
    name: "mint_tokens",
    description: "Build a mint transaction for 250,000 $BAO tokens at $2 in SOL",
    input_schema: {
      type: "object",
      properties: { wallet: { type: "string" } },
      required: ["wallet"],
    },
  },
  {
    name: "sell_tokens",
    description: "Build a sell transaction to sell tokens back to the bonding curve",
    input_schema: {
      type: "object",
      properties: {
        wallet: { type: "string" },
        amount: { type: "number", description: "Token amount to sell (with 6 decimals, e.g. 250000000000 for 250,000 tokens)" },
      },
      required: ["wallet", "amount"],
    },
  },
];

export async function POST(req: NextRequest) {
  const { messages, wallet } = await req.json();

  if (!wallet) {
    return Response.json({ error: "Connect your wallet first" }, { status: 400 });
  }

  const RELAYER = process.env.RELAYER_URL ?? "http://localhost:3001";

  const apiMessages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `My wallet: ${wallet}\n\n${messages[messages.length - 1].content}`,
    },
  ];

  let pendingTransaction: string | undefined;

  // Agentic loop: Claude → tool calls → tool results → Claude → ...
  while (true) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: apiMessages,
      tools: TOOLS,
    });

    apiMessages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      return Response.json({ reply: text, transaction: pendingTransaction });
    }

    if (response.stop_reason !== "tool_use") break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      let resultContent = "";

      if (block.name === "get_price") {
        const r = await fetch(`${RELAYER}/price`);
        const d = await r.json();
        resultContent = JSON.stringify(d);
      } else if (block.name === "get_user_status") {
        const r = await fetch(`${RELAYER}/user/${wallet}`);
        const d = await r.json();
        resultContent = JSON.stringify(d);
      } else if (block.name === "mint_tokens") {
        const r = await fetch(`${RELAYER}/buy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet }),
        });
        const d = await r.json();
        if (d.transaction) {
          pendingTransaction = d.transaction;
          // Don't send raw base64 to Claude — just confirm tx is ready
          const { transaction: _, ...rest } = d;
          resultContent = JSON.stringify({ ...rest, transactionReady: true });
        } else {
          resultContent = JSON.stringify(d);
        }
      } else if (block.name === "sell_tokens") {
        const input = block.input as { amount: number };
        const r = await fetch(`${RELAYER}/sell`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet, tokenAmount: input.amount }),
        });
        const d = await r.json();
        if (d.transaction) {
          pendingTransaction = d.transaction;
          const { transaction: _, ...rest } = d;
          resultContent = JSON.stringify({ ...rest, transactionReady: true });
        } else {
          resultContent = JSON.stringify(d);
        }
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: resultContent,
      });
    }

    apiMessages.push({ role: "user", content: toolResults });
  }

  return Response.json({ reply: "Something went wrong. Please try again." });
}
