import { Destination } from "@travel-and-tour/db";
import { Router, type Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

router.get("/", async (_req, res) => {
  const destinations = await Destination.find().sort({ popular: -1 });
  res.json(destinations);
});

router.get("/:id", async (req, res) => {
  const destination = await Destination.findById(req.params.id);
  if (!destination) {
    res.status(404).json({ error: "Destination not found" });
    return;
  }
  res.json(destination);
});

export { router as destinationsRouter };
