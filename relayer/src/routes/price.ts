import { Hono } from "hono";
import { getConnection, getMintStatePda } from "../solana.js";

// MintState account layout (Anchor):
// discriminator(8) + mint(32) + authority(32) + total_minted(4) + graduated(1) + bump(1) = 78 bytes
const TOTAL_MINTED_OFFSET = 8 + 32 + 32; // 72
const GRADUATED_OFFSET = TOTAL_MINTED_OFFSET + 4;  // 76

const MINT_FEE_SOL = 0.022;
const TOKENS_PER_MINT = 250_000;
const MINT_CAP = 20_000;
const CACHE_TTL_MS = 10_000;

let cache: { data: object; expiresAt: number } | null = null;

export const priceRoute = new Hono().get("/", async (c) => {
  if (cache && Date.now() < cache.expiresAt) {
    return c.json(cache.data);
  }

  try {
    const connection = getConnection();
    const mintStatePda = getMintStatePda();
    const accountInfo = await connection.getAccountInfo(mintStatePda);

    if (!accountInfo) {
      return c.json({ success: false, error: "Mint state not found" }, 404);
    }

    const d = accountInfo.data;
    const totalMinted = d.readUInt32LE(TOTAL_MINTED_OFFSET);
    const graduated = d[GRADUATED_OFFSET] === 1;
    const slotsRemaining = MINT_CAP - totalMinted;
    const progressPct = (totalMinted / MINT_CAP) * 100;

    const data = {
      success: true,
      totalMinted,
      slotsRemaining,
      graduated,
      mintCap: MINT_CAP,
      progressPct: Math.min(100, progressPct),
      pricePerMintSol: MINT_FEE_SOL,
      tokensPerMint: TOKENS_PER_MINT,
      totalSolRaised: totalMinted * MINT_FEE_SOL,
    };

    cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return c.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json({ success: false, error: message }, 500);
  }
});
