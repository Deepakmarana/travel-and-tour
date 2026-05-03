import mongoose from "mongoose";

const { Schema, model } = mongoose;

const destinationSchema = new Schema(
  {
    name: { type: String, required: true },
    country: { type: String, required: true },
    description: { type: String, required: true },
    coverImage: { type: String, required: true },
    images: [{ type: String }],
    popular: { type: Boolean, default: false },
    climate: { type: String },
    bestTimeToVisit: { type: String },
    tourCount: { type: Number, default: 0 },
  },
  { collection: "destination", timestamps: true },
);

export const Destination = model("Destination", destinationSchema);
