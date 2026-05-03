import mongoose from "mongoose";

const { Schema, model } = mongoose;

const itineraryItemSchema = new Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false },
);

const availabilitySlotSchema = new Schema(
  {
    date: { type: Date, required: true },
    totalSpots: { type: Number, required: true },
    bookedSpots: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const tourSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    destination: { type: String, required: true },
    country: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true },
    maxGroupSize: { type: Number, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "challenging"],
      required: true,
    },
    coverImage: { type: String, required: true },
    images: [{ type: String }],
    itinerary: [itineraryItemSchema],
    included: [{ type: String }],
    notIncluded: [{ type: String }],
    highlights: [{ type: String }],
    availability: [availabilitySlotSchema],
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    category: {
      type: String,
      enum: ["adventure", "cultural", "wildlife", "beach", "mountain", "city"],
      required: true,
    },
  },
  { collection: "tour", timestamps: true },
);

export const Tour = model("Tour", tourSchema);
