import { auth } from "@travel-and-tour/auth";
import { env, getAllowedCorsOrigins } from "@travel-and-tour/env/server";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";

import { getStripeClient, isStripeConfigured } from "./lib/stripe.js";
import { bookingsRouter, finalizeCheckoutSession } from "./routes/bookings.js";
import { destinationsRouter } from "./routes/destinations.js";
import { seedRouter } from "./routes/seed.js";
import { toursRouter } from "./routes/tours.js";

const app = express();
const allowedOrigins = getAllowedCorsOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.all("/api/auth{/*path}", toNodeHandler(auth));

app.get("/api/bookings/stripe/webhook", (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "Stripe webhook endpoint is live. Stripe should send POST requests to this URL.",
  });
});

app.post(
  "/api/bookings/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    if (!isStripeConfigured() || !env.STRIPE_WEBHOOK_SECRET) {
      res.status(503).json({ error: "Stripe webhooks are not configured." });
      return;
    }

    const signature = req.headers["stripe-signature"];

    if (typeof signature !== "string") {
      res.status(400).json({ error: "Missing Stripe signature." });
      return;
    }

    try {
      const stripe = getStripeClient();
      const event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        if (session.client_reference_id) {
          await finalizeCheckoutSession(session.client_reference_id, session);
        }
      }

      res.json({ received: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Webhook handling failed.";
      res.status(400).json({ error: message });
    }
  },
);

app.use(express.json());

app.use("/api/tours", toursRouter);
app.use("/api/destinations", destinationsRouter);
app.use("/api/bookings", bookingsRouter);

if (env.NODE_ENV !== "production") {
  app.use("/api/seed", seedRouter);
}

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
