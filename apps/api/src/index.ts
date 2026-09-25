import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { sql } from "drizzle-orm";
import { db } from "./db/client.js";
import { authRoutes } from "./routes/auth.js";
import { authenticate, requirePermission } from "./plugins/auth-guard.js";
import { planRoutes } from "./routes/plans.js";
import { subscriberRoutes } from "./routes/subscribers.js";

const app = Fastify({ logger: true });

app.register(cors, { origin: true });
app.register(jwt, { secret: process.env.JWT_SECRET! });
app.register(authRoutes);
app.register(planRoutes);
app.register(subscriberRoutes);

app.get("/health", async () => {
  return { status: "ok" };
});

app.get("/health/db", async () => {
  try {
    await db.execute(sql`SELECT 1`);
    return { status: "ok", database: "connected" };
  } catch (err) {
    app.log.error(err);
    return { status: "error", database: "disconnected" };
  }
});

app.listen({ port: Number(process.env.PORT) || 4000, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
app.get(
  "/admin/ping",
  { preHandler: [authenticate, requirePermission("user.manage")] },
  async () => {
    return { status: "ok", message: "You have user.manage permission" };
  }
);
