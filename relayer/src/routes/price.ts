import { Hono } from "hono";
import { getConnection, getBondingCurvePda } from "../solana.js";

// BondingCurve account layout (Anchor):
// discriminator(8) + mint(32) + authority(32) + treasury(32)
// + virtual_sol_reserves(8) + virtual_token_reserves(8)
// + real_sol_reserves(8) + real_token_reserves(8)
// + token_total_supply(8) + graduated(1) + bump(1)
const FIELDS_OFFSET = 8 + 32 + 32 + 32; // 104

const MINT_FEE_LAMPORTS = 22_000_000;

export const priceRoute = new Hono().get("/", async (c) => {
  try {
    const connection = getConnection();
    const bondingCurvePda = getBondingCurvePda();
    const accountInfo = await connection.getAccountInfo(bondingCurvePda);

    if (!accountInfo) {
      return c.json({ success: false, error: "Bonding curve not found" }, 404);
    }

    const d = accountInfo.data;
    const virtualSolReserves = Number(d.readBigUInt64LE(FIELDS_OFFSET));
    const virtualTokenReserves = Number(d.readBigUInt64LE(FIELDS_OFFSET + 8));
    const realSolReserves = Number(d.readBigUInt64LE(FIELDS_OFFSET + 16));
    const realTokenReserves = Number(d.readBigUInt64LE(FIELDS_OFFSET + 24));
    const tokenTotalSupply = Number(d.readBigUInt64LE(FIELDS_OFFSET + 32));
    const graduated = d[FIELDS_OFFSET + 40] === 1;

    const pricePerToken = virtualTokenReserves > 0
      ? virtualSolReserves / virtualTokenReserves
      : 0;

    const marketCapSol = (pricePerToken * tokenTotalSupply) / 1e9;
    const mintsDone = Math.floor(realSolReserves / MINT_FEE_LAMPORTS);

    return c.json({
      success: true,
      virtualSolReserves,
      virtualTokenReserves,
      realSolReserves,
      realTokenReserves,
      graduated,
      pricePerToken,
      marketCapSol,
      mintsDone,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json({ success: false, error: message }, 500);
  }
});
