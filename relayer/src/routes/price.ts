import { Hono } from "hono";
import { getConnection, getBondingCurvePda, MINT_PUBKEY } from "../solana.js";

export const priceRoute = new Hono().get("/", async (c) => {
  try {
    const connection = getConnection();
    const bondingCurvePda = getBondingCurvePda(MINT_PUBKEY);
    const accountInfo = await connection.getAccountInfo(bondingCurvePda);

    if (!accountInfo) {
      return c.json({ success: false, error: "Bonding curve not found" }, 404);
    }

    // Deserialize via Anchor IDL post-build
    // For now return mock data shape
    return c.json({
      success: true,
      virtualSolReserves: 30_000_000_000,
      virtualTokenReserves: 10_000_000_000_000_000,
      realSolReserves: 0,
      realTokenReserves: 0,
      graduated: false,
      pricePerToken: 0.000003, // SOL per token (calculated from curve)
      marketCapSol: 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json({ success: false, error: message }, 500);
  }
});
