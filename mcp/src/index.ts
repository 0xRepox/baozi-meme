#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import "dotenv/config";

const RELAYER_URL = process.env.RELAYER_URL ?? "http://localhost:3001";

const server = new McpServer({
  name: "solana-launchpad",
  version: "0.1.0",
});

server.tool(
  "get_price",
  "Get current $BAO price, bonding curve progress, and graduation status",
  {},
  async () => {
    const res = await fetch(`${RELAYER_URL}/price`);
    const data = await res.json() as any;

    if (!data.success) {
      return { content: [{ type: "text", text: `Error: ${data.error}` }] };
    }

    const graduated = data.graduated ? "YES — trading on Meteora" : "NO — bonding curve active";
    const slotsUsed = Math.round((data.realSolReserves / 22_000_000));
    const progress = ((slotsUsed / 20_000) * 100).toFixed(1);

    return {
      content: [{
        type: "text",
        text: [
          `Price: ${data.pricePerToken} SOL per token`,
          `Market cap: ${data.marketCapSol} SOL`,
          `Slots filled: ${slotsUsed.toLocaleString()} / 20,000 (${progress}%)`,
          `Graduated: ${graduated}`,
        ].join("\n"),
      }],
    };
  }
);

server.tool(
  "get_user_status",
  "Check mints used and remaining for a wallet (max 10 per wallet)",
  { wallet: z.string().describe("Solana wallet public key") },
  async ({ wallet }) => {
    const res = await fetch(`${RELAYER_URL}/user/${wallet}`);
    const data = await res.json() as any;

    if (!data.success) {
      return { content: [{ type: "text", text: `Error: ${data.error}` }] };
    }

    if (!data.registered) {
      return {
        content: [{
          type: "text",
          text: "Not registered. User must sign the one-time registration on the site first.",
        }],
      };
    }

    return {
      content: [{
        type: "text",
        text: [
          `Mints used: ${data.mintsUsed} / 10`,
          `Mints remaining: ${data.mintsRemaining}`,
          `Total spent: ${(data.totalSpentLamports / 1e9).toFixed(4)} SOL`,
        ].join("\n"),
      }],
    };
  }
);

server.tool(
  "mint_tokens",
  "Mint $BAO tokens. Each mint = 250,000 tokens for 0.022 SOL. Max 10 per wallet, up to 10 at once.",
  {
    wallet: z.string().describe("Solana wallet public key"),
    quantity: z.number().int().min(1).max(10).default(1).describe("Number of mint slots to use (1–10)"),
  },
  async ({ wallet, quantity }) => {
    const userRes = await fetch(`${RELAYER_URL}/user/${wallet}`);
    const userData = await userRes.json() as any;

    if (!userData.registered) {
      return {
        content: [{
          type: "text",
          text: "Wallet not registered. Connect on the site and sign the one-time registration first.",
        }],
      };
    }

    if (userData.mintsRemaining === 0) {
      return {
        content: [{ type: "text", text: "No mints remaining. Max 10 per wallet." }],
      };
    }

    const actualQty = Math.min(quantity, userData.mintsRemaining);

    const res = await fetch(`${RELAYER_URL}/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, quantity: actualQty }),
    });
    const data = await res.json() as any;

    if (!data.success) {
      return { content: [{ type: "text", text: `Mint failed: ${data.error}` }] };
    }

    return {
      content: [{
        type: "text",
        text: [
          `PENDING_TX:${data.transaction}`,
          `Minting ${data.tokensToReceive.toLocaleString()} $BAO (${actualQty} slot${actualQty > 1 ? "s" : ""} × 0.022 SOL). Approve in wallet.`,
          `Mints remaining after: ${data.mintsRemaining}`,
        ].join("\n"),
      }],
    };
  }
);

server.tool(
  "sell_tokens",
  "Sell $BAO tokens back to the bonding curve for SOL",
  {
    wallet: z.string().describe("Solana wallet public key"),
    amount: z.number().positive().describe("Number of tokens to sell"),
  },
  async ({ wallet, amount }) => {
    const res = await fetch(`${RELAYER_URL}/sell`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, tokenAmount: amount, minSolOut: 0 }),
    });
    const data = await res.json() as any;

    if (!data.success) {
      return { content: [{ type: "text", text: `Sell failed: ${data.error}` }] };
    }

    return {
      content: [{
        type: "text",
        text: [
          `PENDING_TX:${data.transaction}`,
          `Selling ${amount.toLocaleString()} $BAO. Approve in wallet.`,
        ].join("\n"),
      }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server running on stdio");
}

main().catch(console.error);
