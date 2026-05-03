import { client } from "@travel-and-tour/db";
import { env, getAllowedCorsOrigins } from "@travel-and-tour/env/server";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

export function createAuth() {
  return betterAuth({
    database: mongodbAdapter(client),
    trustedOrigins: getAllowedCorsOrigins(),
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
  });
}

export const auth = createAuth();
