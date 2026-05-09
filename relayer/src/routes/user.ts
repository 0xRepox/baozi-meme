import { Hono } from "hono";
import { PublicKey } from "@solana/web3.js";
import { getUserStatus, buildRegisterUserTx } from "../solana.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const userRoute = new Hono()
  .get("/:wallet", async (c) => {
    const { wallet } = c.req.param();
    try {
      const status = await getUserStatus(new PublicKey(wallet));
      return c.json({ success: true, ...status });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return c.json({ success: false, error: message }, 500);
    }
  })
  .post(
    "/register",
    zValidator("json", z.object({ wallet: z.string().min(32) })),
    async (c) => {
      const { wallet } = c.req.valid("json");
      try {
        const tx = await buildRegisterUserTx(new PublicKey(wallet));
        const serialized = tx.serialize({ requireAllSignatures: false }).toString("base64");
        return c.json({ success: true, transaction: serialized });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return c.json({ success: false, error: message }, 500);
      }
    }
  );
