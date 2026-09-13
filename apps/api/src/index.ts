import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { contractsRouter } from "./modules/contracts/router.js";

const app = new Hono()
  .use(
    cors({
      origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    }),
  )
  .route("/contracts", contractsRouter);

export type AppType = typeof app;

serve(
  {
    fetch: app.fetch,
    hostname: "0.0.0.0",
    port: Number(process.env.PORT ?? 8000),
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
