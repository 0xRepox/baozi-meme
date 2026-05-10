import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import "dotenv/config";
import { mintRoute } from "./routes/mint.js";
import { priceRoute } from "./routes/price.js";
import { userRoute } from "./routes/user.js";

// Simple in-memory rate limiter: max requests per window per IP
const WINDOW_MS = 60_000;
const LIMITS: Record<string, number> = {
  "/mint":          5,   // 5 mints per minute per IP
  "/user/register": 3,   // 3 registrations per minute per IP
  "default":        60,  // everything else
};

const buckets = new Map<string, { count: number; resetAt: number }>();

function getLimit(path: string): number {
  for (const [prefix, limit] of Object.entries(LIMITS)) {
    if (path.startsWith(prefix)) return limit;
  }
  return LIMITS.default;
}

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.use("*", async (c, next) => {
  const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim()
    ?? c.req.header("x-real-ip")
    ?? "unknown";
  const path = new URL(c.req.url).pathname;
  const key = `${ip}:${path}`;
  const limit = getLimit(path);
  const now = Date.now();

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else if (bucket.count >= limit) {
    return c.json({ success: false, error: "Rate limit exceeded. Try again shortly." }, 429);
  } else {
    bucket.count++;
  }

  return next();
});

app.get("/health", (c) => c.json({ ok: true }));

app.route("/mint", mintRoute);
app.route("/price", priceRoute);
app.route("/user", userRoute);

// Prune stale buckets every 5 minutes to avoid unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}, 5 * 60_000);

const port = Number(process.env.PORT ?? 3001);
console.log(`Relayer running on port ${port}`);

serve({ fetch: app.fetch, port });
