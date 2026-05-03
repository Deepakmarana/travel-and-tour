import mongoose from "mongoose";

const { Schema, model } = mongoose;

const bookingSchema = new Schema(
  {
    userId: { type: String, ref: "User", required: true },
    tourId: { type: Schema.Types.ObjectId, ref: "Tour", required: true },
    date: { type: Date, required: true },
    travelers: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "confirmed",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid", "no_payment_required", "refunded"],
      default: "no_payment_required",
    },
    paymentSessionId: { type: String, index: true, unique: true, sparse: true },
    paymentIntentId: { type: String, index: true, unique: true, sparse: true },
    currency: { type: String, default: "usd" },
    specialRequests: { type: String },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String },
  },
  { collection: "booking", timestamps: true },
);

export const Booking = model("Booking", bookingSchema);
