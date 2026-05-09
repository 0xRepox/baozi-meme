import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { buildSellTx } from "../solana.js";

const schema = z.object({
  wallet: z.string().min(32),
  tokenAmount: z.number().positive(),
});

export const sellRoute = new Hono().post(
  "/",
  zValidator("json", schema),
  async (c) => {
    const { wallet, tokenAmount } = c.req.valid("json");

    try {
      const userPubkey = new PublicKey(wallet);
      const tx = await buildSellTx(userPubkey, BigInt(tokenAmount));
      const serialized = tx.serialize({ requireAllSignatures: false }).toString("base64");

      return c.json({
        success: true,
        transaction: serialized,
        message: `Sign to sell ${tokenAmount.toLocaleString()} $BAO`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return c.json({ success: false, error: message }, 500);
    }
  }
);
