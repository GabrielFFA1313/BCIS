import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { sql } from "drizzle-orm";
import { db } from "./db/client.js";

const app = Fastify({ logger: true });

app.register(cors, {
  origin: true,
});

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