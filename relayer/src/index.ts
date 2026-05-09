import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import "dotenv/config";
import { buyRoute } from "./routes/buy.js";
import { sellRoute } from "./routes/sell.js";
import { priceRoute } from "./routes/price.js";
import { userRoute } from "./routes/user.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));

app.get("/health", (c) => c.json({ ok: true }));

app.route("/buy", buyRoute);
app.route("/sell", sellRoute);
app.route("/price", priceRoute);
app.route("/user", userRoute);

const port = Number(process.env.PORT ?? 3001);
console.log(`Relayer running on port ${port}`);

serve({ fetch: app.fetch, port });
