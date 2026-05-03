import { Booking, Tour } from "@travel-and-tour/db";
import { env } from "@travel-and-tour/env/server";
import { Router, type Response, type Router as ExpressRouter } from "express";
import Stripe from "stripe";
import { z } from "zod";

import { getStripeClient, isStripeConfigured } from "../lib/stripe.js";
import { requireAuth } from "../middleware/auth.js";

const router: ExpressRouter = Router();

const checkoutSchema = z.object({
  tourId: z.string().min(1),
  date: z.string().min(1),
  travelers: z.number().int().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  specialRequests: z.string().optional(),
});

const directBookingSchema = checkoutSchema;
const STRIPE_DEV_BYPASS_MESSAGE =
  "Stripe checkout is unavailable in development, so your booking was created without taking payment.";
type BookingRequest = z.infer<typeof checkoutSchema>;

const confirmCheckoutSchema = z.object({
  sessionId: z.string().min(1),
});

router.use(requireAuth);

class BookingRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function getDateKey(value: string | Date) {
  return new Date(value).toDateString();
}

function respondStripeNotConfigured(res: Response) {
  res.status(503).json({
    error: "Payments are not configured yet. Add STRIPE_SECRET_KEY to the server environment.",
  });
}

function readBookingMetadata(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;

  if (!metadata?.tourId || !metadata.date || !metadata.travelers || !metadata.contactEmail) {
    throw new Error("Checkout session is missing booking details.");
  }

  const travelers = Number(metadata.travelers);

  if (!Number.isInteger(travelers) || travelers < 1) {
    throw new Error("Checkout session has an invalid traveller count.");
  }

  return {
    tourId: metadata.tourId,
    date: metadata.date,
    travelers,
    contactEmail: metadata.contactEmail,
    contactPhone: metadata.contactPhone ?? "",
    specialRequests: metadata.specialRequests ?? "",
  };
}

async function getBookableTourContext(tourId: string, date: string, travelers: number) {
  const tour = await Tour.findById(tourId);

  if (!tour) {
    throw new BookingRequestError(404, "Tour not found");
  }

  const slotIndex = tour.availability.findIndex(
    (slot) => getDateKey(slot.date) === getDateKey(date),
  );

  if (slotIndex === -1) {
    throw new BookingRequestError(400, "Selected date is not available");
  }

  const slot = tour.availability[slotIndex];

  if (!slot) {
    throw new BookingRequestError(400, "Selected date is not available");
  }

  if (slot.bookedSpots + travelers > slot.totalSpots) {
    throw new BookingRequestError(400, "Not enough spots available for this date");
  }

  return { tour, slot };
}

async function createDirectBookingRecord(userId: string, bookingData: BookingRequest) {
  const { tour, slot } = await getBookableTourContext(
    bookingData.tourId,
    bookingData.date,
    bookingData.travelers,
  );

  slot.bookedSpots += bookingData.travelers;
  await tour.save();

  return Booking.create({
    userId,
    tourId: bookingData.tourId,
    date: bookingData.date,
    travelers: bookingData.travelers,
    totalPrice: tour.price * bookingData.travelers,
    status: "confirmed",
    paymentStatus: "no_payment_required",
    currency: env.STRIPE_CURRENCY,
    contactEmail: bookingData.contactEmail,
    contactPhone: bookingData.contactPhone,
    specialRequests: bookingData.specialRequests,
  });
}

function isStripeCheckoutSetupError(error: unknown) {
  return (
    error instanceof Stripe.errors.StripePermissionError ||
    error instanceof Stripe.errors.StripeAuthenticationError
  );
}

function getStripeCheckoutErrorMessage(error: unknown) {
  if (error instanceof Stripe.errors.StripePermissionError) {
    if (error.message.includes("rak_checkout_session_write")) {
      return "The configured Stripe key cannot create Checkout Sessions. Use an sk_test_/sk_live_ secret key, or grant the restricted key the rak_checkout_session_write permission.";
    }

    return "The configured Stripe key does not have permission to start Checkout.";
  }

  if (error instanceof Stripe.errors.StripeAuthenticationError) {
    return "Stripe rejected STRIPE_SECRET_KEY. Update the server env file with a valid key and restart the server.";
  }

  return error instanceof Error ? error.message : "Could not create a checkout session";
}

export async function finalizeCheckoutSession(userId: string, session: Stripe.Checkout.Session) {
  const existingBooking = await Booking.findOne({
    paymentSessionId: session.id,
    userId,
  });

  if (existingBooking) {
    return existingBooking;
  }

  if (session.client_reference_id !== userId) {
    throw new Error("This payment session does not belong to the current user.");
  }

  if (session.mode !== "payment" || session.status !== "complete" || session.payment_status !== "paid") {
    throw new Error("Payment has not completed yet.");
  }

  const metadata = readBookingMetadata(session);
  const tour = await Tour.findById(metadata.tourId);

  if (!tour) {
    throw new Error("Tour not found for this payment.");
  }

  const slotIndex = tour.availability.findIndex(
    (slot) => getDateKey(slot.date) === getDateKey(metadata.date),
  );

  if (slotIndex === -1) {
    throw new Error("Selected date is no longer available.");
  }

  const slot = tour.availability[slotIndex];

  if (!slot) {
    throw new Error("Selected date is no longer available.");
  }

  if (slot.bookedSpots + metadata.travelers > slot.totalSpots) {
    throw new Error(
      "Payment succeeded, but this departure just sold out before we could confirm the booking. Please contact support for a refund.",
    );
  }

  const expectedAmount = Math.round(tour.price * metadata.travelers * 100);

  if ((session.amount_total ?? 0) !== expectedAmount) {
    throw new Error("Payment amount does not match the booking total.");
  }

  slot.bookedSpots += metadata.travelers;
  await tour.save();

  const booking = await Booking.create({
    userId,
    tourId: metadata.tourId,
    date: metadata.date,
    travelers: metadata.travelers,
    totalPrice: tour.price * metadata.travelers,
    status: "confirmed",
    paymentStatus: "paid",
    paymentSessionId: session.id,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id,
    currency: session.currency ?? env.STRIPE_CURRENCY,
    contactEmail: metadata.contactEmail,
    contactPhone: metadata.contactPhone || undefined,
    specialRequests: metadata.specialRequests || undefined,
  });

  return booking;
}

router.get("/", async (req, res) => {
  const bookings = await Booking.find({ userId: req.userId! })
    .populate("tourId")
    .sort({ createdAt: -1 });
  res.json(bookings);
});

router.post("/checkout-session", async (req, res) => {
  if (!isStripeConfigured()) {
    respondStripeNotConfigured(res);
    return;
  }

  const parsed = checkoutSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid checkout request" });
    return;
  }

  const { tourId, date, travelers, contactEmail, contactPhone, specialRequests } = parsed.data;
  let bookableTour: Awaited<ReturnType<typeof getBookableTourContext>>;

  try {
    bookableTour = await getBookableTourContext(tourId, date, travelers);
  } catch (error) {
    const status = error instanceof BookingRequestError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Could not prepare the booking";
    res.status(status).json({ error: message });
    return;
  }

  const { tour } = bookableTour;

  const stripe = getStripeClient();
  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: req.userId!,
      success_url: `${env.CORS_ORIGIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.CORS_ORIGIN}/book/${tour._id}`,
      customer_email: contactEmail,
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: travelers,
          price_data: {
            currency: env.STRIPE_CURRENCY,
            unit_amount: Math.round(tour.price * 100),
            product_data: {
              name: tour.title,
              description: `${tour.destination}, ${tour.country}`,
              unit_label: "traveller",
            },
          },
        },
      ],
      metadata: {
        tourId,
        date,
        travelers: String(travelers),
        contactEmail,
        contactPhone: contactPhone ?? "",
        specialRequests: specialRequests ?? "",
      },
    });
  } catch (error) {
    if (env.NODE_ENV !== "production" && isStripeCheckoutSetupError(error)) {
      try {
        const booking = await createDirectBookingRecord(req.userId!, parsed.data);

        console.warn(
          `Stripe checkout bypassed in ${env.NODE_ENV}: ${getStripeCheckoutErrorMessage(error)}`,
        );

        res.status(201).json({
          mode: "direct_booking",
          booking,
          message: STRIPE_DEV_BYPASS_MESSAGE,
        });
        return;
      } catch (bookingError) {
        const status = bookingError instanceof BookingRequestError ? bookingError.status : 500;
        const message =
          bookingError instanceof Error ? bookingError.message : "Could not create the booking";
        res.status(status).json({ error: message });
        return;
      }
    }

    res.status(isStripeCheckoutSetupError(error) ? 503 : 500).json({
      error: getStripeCheckoutErrorMessage(error),
    });
    return;
  }

  if (!session.url) {
    res.status(500).json({ error: "Could not create a checkout session" });
    return;
  }

  res.status(201).json({ mode: "stripe", url: session.url, sessionId: session.id });
});

router.post("/checkout-session/:sessionId/confirm", async (req, res) => {
  if (!isStripeConfigured()) {
    respondStripeNotConfigured(res);
    return;
  }

  const parsed = confirmCheckoutSchema.safeParse(req.params);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid checkout session id" });
    return;
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(parsed.data.sessionId);

  try {
    const booking = await finalizeCheckoutSession(req.userId!, session);
    res.json(booking);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not confirm booking";
    res.status(400).json({ error: message });
  }
});

router.post("/", async (req, res) => {
  const parsed = directBookingSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid booking request" });
    return;
  }

  try {
    const booking = await createDirectBookingRecord(req.userId!, parsed.data);
    res.status(201).json(booking);
  } catch (error) {
    const status = error instanceof BookingRequestError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Could not create the booking";
    res.status(status).json({ error: message });
  }
});

router.patch("/:id/cancel", async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, userId: req.userId! });

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  if (booking.status === "cancelled") {
    res.status(400).json({ error: "Booking is already cancelled" });
    return;
  }

  const tour = await Tour.findById(booking.tourId);

  if (tour) {
    const slotIndex = tour.availability.findIndex(
      (slot) => getDateKey(slot.date) === getDateKey(booking.date),
    );

    if (slotIndex !== -1) {
      const slot = tour.availability[slotIndex];

      if (slot) {
        slot.bookedSpots = Math.max(0, slot.bookedSpots - booking.travelers);
        await tour.save();
      }
    }
  }

  booking.status = "cancelled";
  await booking.save();
  res.json(booking);
});

export { router as bookingsRouter };
