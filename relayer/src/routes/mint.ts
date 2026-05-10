import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { buildMintTx, getUserStatus } from "../solana.js";

const schema = z.object({
  wallet: z.string().min(32),
  quantity: z.number().int().min(1).max(10).default(1),
});

export const mintRoute = new Hono().post(
  "/",
  zValidator("json", schema),
  async (c) => {
    const { wallet, quantity } = c.req.valid("json");

    try {
      const userPubkey = new PublicKey(wallet);
      const status = await getUserStatus(userPubkey);

      if (!status.registered) {
        return c.json({ success: false, error: "Wallet not registered. Sign once on the site first." }, 400);
      }
      if (status.mintsRemaining === 0) {
        return c.json({ success: false, error: "Max 10 mints per wallet reached." }, 400);
      }

      const actualQty = Math.min(quantity, status.mintsRemaining);
      const tx = await buildMintTx(userPubkey, actualQty);
      const serialized = tx.serialize({ requireAllSignatures: false }).toString("base64");
      const tokensToReceive = actualQty * 250_000;

      return c.json({
        success: true,
        transaction: serialized,
        quantity: actualQty,
        tokensToReceive,
        mintsRemaining: status.mintsRemaining - actualQty,
        message: `Sign to mint ${tokensToReceive.toLocaleString()} $BAO (${actualQty} × 250,000)`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return c.json({ success: false, error: message }, 500);
    }
  }
);
