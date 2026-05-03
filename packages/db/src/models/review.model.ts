import mongoose from "mongoose";

const { Schema, model } = mongoose;

const reviewSchema = new Schema(
  {
    userId: { type: String, ref: "User", required: true },
    tourId: { type: Schema.Types.ObjectId, ref: "Tour", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true },
    comment: { type: String, required: true },
    userName: { type: String, required: true },
  },
  { collection: "review", timestamps: true },
);

export const Review = model("Review", reviewSchema);
