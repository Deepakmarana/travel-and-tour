import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    STRIPE_SECRET_KEY: z
      .string()
      .regex(/^(sk|rk)_(test|live)_/, "Stripe key must start with sk_... or rk_...")
      .optional(),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
    STRIPE_CURRENCY: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toLowerCase())
      .default("usd"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export function getAllowedCorsOrigins() {
  const primaryOrigin = env.CORS_ORIGIN;
  const origins = new Set([primaryOrigin]);
  const url = new URL(primaryOrigin);
  const devPorts = ["3001", "4173", "5173"];

  function addOrigin(hostname: string, port = url.port) {
    const candidate = new URL(primaryOrigin);
    candidate.hostname = hostname;
    candidate.port = port;
    origins.add(candidate.origin);
  }

  if (url.hostname === "localhost") {
    addOrigin("127.0.0.1");

    for (const port of devPorts) {
      addOrigin("localhost", port);
      addOrigin("127.0.0.1", port);
    }
  }

  if (url.hostname === "127.0.0.1") {
    addOrigin("localhost");

    for (const port of devPorts) {
      addOrigin("127.0.0.1", port);
      addOrigin("localhost", port);
    }
  }

  return [...origins];
}
