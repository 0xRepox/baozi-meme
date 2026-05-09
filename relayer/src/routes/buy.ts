import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { buildBuyTx, getUserStatus } from "../solana.js";

const schema = z.object({ wallet: z.string().min(32) });

export const buyRoute = new Hono().post(
  "/",
  zValidator("json", schema),
  async (c) => {
    const { wallet } = c.req.valid("json");

    try {
      const userPubkey = new PublicKey(wallet);
      const status = await getUserStatus(userPubkey);

      if (!status.registered) {
        return c.json({ success: false, error: "Wallet not registered. Sign once on the site first." }, 400);
      }
      if (status.mintsRemaining === 0) {
        return c.json({ success: false, error: "Max 10 mints per wallet reached." }, 400);
      }

      const tx = await buildBuyTx(userPubkey);
      const serialized = tx.serialize({ requireAllSignatures: false }).toString("base64");

      return c.json({
        success: true,
        transaction: serialized,
        message: "Sign this transaction to mint 250,000 $BAO",
        tokensToReceive: 250_000,
        mintsRemaining: status.mintsRemaining - 1,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return c.json({ success: false, error: message }, 500);
    }
  }
);
