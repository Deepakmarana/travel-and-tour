import { env } from "@travel-and-tour/env/server";
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function getStripeClient() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured");
  }

  stripeClient ??= new Stripe(env.STRIPE_SECRET_KEY);

  return stripeClient;
}
