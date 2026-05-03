import { Review, Tour } from "@travel-and-tour/db";
import { Router, type Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

router.get("/featured", async (_req, res) => {
  const tours = await Tour.find({ featured: true }).limit(6);
  res.json(tours);
});

router.get("/", async (req, res) => {
  const { category, search, page = "1", limit = "12" } = req.query;
  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { destination: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } },
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [tours, total] = await Promise.all([
    Tour.find(filter).skip(skip).limit(Number(limit)).sort({ featured: -1, createdAt: -1 }),
    Tour.countDocuments(filter),
  ]);
  res.json({ tours, total, page: Number(page), limit: Number(limit) });
});

router.get("/:id/reviews", async (req, res) => {
  const reviews = await Review.find({ tourId: req.params.id }).sort({ createdAt: -1 });
  res.json(reviews);
});

router.get("/:id", async (req, res) => {
  const tour = await Tour.findById(req.params.id);
  if (!tour) {
    res.status(404).json({ error: "Tour not found" });
    return;
  }
  res.json(tour);
});

export { router as toursRouter };
