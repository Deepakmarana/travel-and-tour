import { env } from "@travel-and-tour/env/server";
import mongoose from "mongoose";

await mongoose.connect(env.DATABASE_URL).catch((error) => {
  console.log("Error connecting to database:", error);
});

const client = mongoose.connection.getClient().db("myDB");

export { client };
export * from "./models/auth.model.js";
export * from "./models/booking.model.js";
export * from "./models/destination.model.js";
export * from "./models/review.model.js";
export * from "./models/tour.model.js";
