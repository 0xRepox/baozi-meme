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

// --- get_price ---
server.tool(
  "get_price",
  "Get the current token price, market cap, and bonding curve status",
  {},
  async () => {
    const res = await fetch(`${RELAYER_URL}/price`);
    const data = await res.json() as any;

    if (!data.success) {
      return { content: [{ type: "text", text: `Error: ${data.error}` }] };
    }

    const graduated = data.graduated ? "YES - trading on Raydium" : "NO - bonding curve active";
    const progress = ((data.realSolReserves / 85_000_000_000) * 100).toFixed(2);

    return {
      content: [{
        type: "text",
        text: [
          `📊 Token Price: ${data.pricePerToken} SOL`,
          `💰 Market Cap: ${data.marketCapSol} SOL`,
          `📈 Bonding Curve Progress: ${progress}% (${data.realSolReserves / 1e9} / 85 SOL to graduation)`,
          `🎓 Graduated: ${graduated}`,
        ].join("\n"),
      }],
    };
  }
);

// --- get_user_status ---
server.tool(
  "get_user_status",
  "Check how many mints a wallet has used and how many remain (max 10)",
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
          text: "This wallet hasn't registered yet. They need to sign the one-time registration transaction on the site first.",
        }],
      };
    }

    return {
      content: [{
        type: "text",
        text: [
          `👛 Wallet: ${wallet}`,
          `✅ Mints used: ${data.mintsUsed} / 10`,
          `🪙 Mints remaining: ${data.mintsRemaining}`,
          `💸 Total spent: ${(data.totalSpentLamports / 1e9).toFixed(4)} SOL`,
          data.mintsRemaining === 0
            ? "⛔ Max mints reached. This wallet cannot mint more tokens."
            : `Ready to mint — each mint gives 250,000 tokens for $2.`,
        ].join("\n"),
      }],
    };
  }
);

// --- mint_tokens ---
server.tool(
  "mint_tokens",
  "Mint 250,000 tokens for $2 (in SOL). Requires wallet to be registered and have mints remaining.",
  { wallet: z.string().describe("Solana wallet public key to mint tokens to") },
  async ({ wallet }) => {
    // Check user status first
    const userRes = await fetch(`${RELAYER_URL}/user/${wallet}`);
    const userData = await userRes.json() as any;

    if (!userData.registered) {
      return {
        content: [{
          type: "text",
          text: "❌ Wallet not registered. Please connect your wallet on the site and sign the one-time registration transaction first.",
        }],
      };
    }

    if (userData.mintsRemaining === 0) {
      return {
        content: [{
          type: "text",
          text: "⛔ You've used all 10 mints. Maximum of 2,500,000 tokens per wallet reached.",
        }],
      };
    }

    const res = await fetch(`${RELAYER_URL}/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet }),
    });
    const data = await res.json() as any;

    if (!data.success) {
      return { content: [{ type: "text", text: `❌ Mint failed: ${data.error}` }] };
    }

    return {
      content: [{
        type: "text",
        text: [
          `✅ Minted successfully!`,
          `🪙 Tokens received: 250,000`,
          `💸 Cost: $2 in SOL`,
          `🔢 Mints remaining: ${userData.mintsRemaining - 1} / 10`,
          userData.mintsRemaining - 1 === 0
            ? "⛔ You've now used all your mints."
            : `Say "mint again" to use another mint slot.`,
        ].join("\n"),
      }],
    };
  }
);

// --- sell_tokens ---
server.tool(
  "sell_tokens",
  "Sell tokens back to the bonding curve for SOL. 1% trading fee applies.",
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
      return { content: [{ type: "text", text: `❌ Sell failed: ${data.error}` }] };
    }

    return {
      content: [{
        type: "text",
        text: [
          `✅ Sold ${amount.toLocaleString()} tokens`,
          `💰 SOL received: ${data.solReceived ?? "calculating..."}`,
          `📉 1% fee deducted`,
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
