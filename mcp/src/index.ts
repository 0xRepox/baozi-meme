#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import "dotenv/config";

const RELAYER_URL = process.env.RELAYER_URL ?? "http://localhost:3001";
const PORT = parseInt(process.env.PORT ?? "3002");

function createMcpServer(): McpServer {
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
      const data = await res.json() as Record<string, unknown>;

      if (!data.success) {
        return { content: [{ type: "text" as const, text: `Error: ${data.error}` }] };
      }

      const graduated = data.graduated ? "YES — trading on Meteora" : "NO — bonding curve active";
      const slotsUsed = Math.round((data.realSolReserves as number) / 22_000_000);
      const progress = ((slotsUsed / 20_000) * 100).toFixed(1);

      return {
        content: [{
          type: "text" as const,
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
      const data = await res.json() as Record<string, unknown>;

      if (!data.success) {
        return { content: [{ type: "text" as const, text: `Error: ${data.error}` }] };
      }

      if (!data.registered) {
        return {
          content: [{
            type: "text" as const,
            text: "Not registered. User must sign the one-time registration on the site first.",
          }],
        };
      }

      return {
        content: [{
          type: "text" as const,
          text: [
            `Mints used: ${data.mintsUsed} / 10`,
            `Mints remaining: ${data.mintsRemaining}`,
            `Total spent: ${((data.totalSpentLamports as number) / 1e9).toFixed(4)} SOL`,
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
      const userData = await userRes.json() as Record<string, unknown>;

      if (!userData.registered) {
        return {
          content: [{
            type: "text" as const,
            text: "Wallet not registered. Connect on the site and sign the one-time registration first.",
          }],
        };
      }

      if (userData.mintsRemaining === 0) {
        return {
          content: [{ type: "text" as const, text: "No mints remaining. Max 10 per wallet." }],
        };
      }

      const actualQty = Math.min(quantity, userData.mintsRemaining as number);

      const res = await fetch(`${RELAYER_URL}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, quantity: actualQty }),
      });
      const data = await res.json() as Record<string, unknown>;

      if (!data.success) {
        return { content: [{ type: "text" as const, text: `Mint failed: ${data.error}` }] };
      }

      return {
        content: [{
          type: "text" as const,
          text: [
            `PENDING_TX:${data.transaction}`,
            `Minting ${(data.tokensToReceive as number).toLocaleString()} $BAO (${actualQty} slot${actualQty > 1 ? "s" : ""} × 0.022 SOL). Approve in wallet.`,
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
      const data = await res.json() as Record<string, unknown>;

      if (!data.success) {
        return { content: [{ type: "text" as const, text: `Sell failed: ${data.error}` }] };
      }

      return {
        content: [{
          type: "text" as const,
          text: [
            `PENDING_TX:${data.transaction}`,
            `Selling ${amount.toLocaleString()} $BAO. Approve in wallet.`,
          ].join("\n"),
        }],
      };
    }
  );

  return server;
}

const sessions = new Map<string, StreamableHTTPServerTransport>();

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString();
      try {
        resolve(raw ? JSON.parse(raw) : undefined);
      } catch {
        resolve(undefined);
      }
    });
    req.on("error", reject);
  });
}

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url.pathname !== "/mcp") {
    res.writeHead(404).end("Not found");
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id");

  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  if (req.method === "POST") {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && sessions.has(sessionId)) {
      transport = sessions.get(sessionId)!;
    } else {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, transport);
        },
      });
      transport.onclose = () => {
        const id = transport.sessionId;
        if (id) sessions.delete(id);
      };
      const server = createMcpServer();
      await server.connect(transport);
    }

    const body = await readBody(req);
    await transport.handleRequest(req, res, body);
    return;
  }

  if (req.method === "GET") {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.writeHead(400).end("Missing or invalid session ID");
      return;
    }
    await sessions.get(sessionId)!.handleRequest(req, res);
    return;
  }

  if (req.method === "DELETE") {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (sessionId && sessions.has(sessionId)) {
      await sessions.get(sessionId)!.close();
      sessions.delete(sessionId);
    }
    res.writeHead(200).end();
    return;
  }

  res.writeHead(405).end("Method not allowed");
});

httpServer.listen(PORT, () => {
  console.error(`MCP HTTP server running on :${PORT}`);
  console.error(`Endpoint: http://localhost:${PORT}/mcp`);
  console.error(`Relayer:  ${RELAYER_URL}`);
});
