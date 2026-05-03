import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@travel-and-tour/ui/components/button";
import {
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  Globe,
  MapPin,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { StarRating } from "@/components/star-rating";
import { api, type Tour } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { formatTravelDate } from "@/lib/format-travel-date";

export const Route = createFileRoute("/tours_/$tourId")({
  loader: async ({ params }) => {
    const [tour, reviews] = await Promise.all([
      api.tours.detail(params.tourId),
      api.tours.reviews(params.tourId),
    ]);
    return { tour, reviews };
  },
  component: TourDetailComponent,
});

const DIFF_COLOR: Record<Tour["difficulty"], string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  moderate: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  challenging: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

const TABS = ["Overview", "Itinerary", "Included"] as const;
type Tab = (typeof TABS)[number];

function TourDetailComponent() {
  const { tour, reviews } = Route.useLoaderData();
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Overview");
  const [galleryIdx, setGalleryIdx] = useState<number | null>(null);
  const allImages = [tour.coverImage, ...tour.images];
  const availableSlots = tour.availability.filter((s) => s.bookedSpots < s.totalSpots);

  function handleBookNow() {
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
    navigate({ to: "/book/$tourId", params: { tourId: tour._id } });
  }

  return (
    <div className="overflow-y-auto">
      {/* Back */}
      <div className="mx-auto max-w-7xl px-6 pt-4">
        <Link
          to="/tours"
          search={{ search: "", category: "", page: 1 }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to tours
        </Link>
      </div>

      {/* Hero image + gallery */}
      <div className="mx-auto mt-3 max-w-7xl px-6">
        <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
          <div
            className="relative h-72 cursor-pointer overflow-hidden rounded-xl sm:h-96"
            onClick={() => setGalleryIdx(0)}
          >
            <img
              src={tour.coverImage}
              alt={tour.title}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
          {tour.images.length > 0 && (
            <div className="hidden grid-rows-2 gap-2 sm:grid">
              {tour.images.slice(0, 2).map((img, i) => (
                <div
                  key={i}
                  className="relative cursor-pointer overflow-hidden rounded-xl"
                  onClick={() => setGalleryIdx(i + 1)}
                >
                  <img
                    src={img}
                    alt={`${tour.title} ${i + 2}`}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        {allImages.length > 3 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {allImages.slice(3).map((img, i) => (
              <div
                key={i}
                className="relative h-20 w-28 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-border"
                onClick={() => setGalleryIdx(i + 3)}
              >
                <img
                  src={img}
                  alt={`${tour.title} photo ${i + 4}`}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {galleryIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setGalleryIdx(null)}
        >
          <button className="absolute right-4 top-4 text-white" onClick={() => setGalleryIdx(null)}>
            <X className="h-8 w-8" />
          </button>
          <img
            src={allImages[galleryIdx]}
            alt={tour.title}
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Main content + sidebar */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* ── Left: details ── */}
          <div className="min-w-0 flex-1">
            {/* Title & meta */}
            <div className="mb-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
                  {tour.category}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${DIFF_COLOR[tour.difficulty]}`}
                >
                  {tour.difficulty}
                </span>
              </div>
              <h1 className="mb-2 text-3xl font-bold">{tour.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {tour.destination}, {tour.country}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {tour.duration} days
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Max {tour.maxGroupSize} people
                </span>
                {tour.reviewCount > 0 && (
                  <StarRating rating={tour.averageRating} reviewCount={tour.reviewCount} size="sm" />
                )}
              </div>
            </div>

            {/* Tab nav */}
            <div className="mb-6 flex gap-1 border-b border-border">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={[
                    "px-4 py-2.5 text-sm font-medium transition-colors",
                    tab === t
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Overview */}
            {tab === "Overview" && (
              <div className="space-y-6">
                <div>
                  <h2 className="mb-3 font-semibold text-lg">About this tour</h2>
                  <p className="leading-relaxed text-muted-foreground">{tour.description}</p>
                </div>
                {tour.highlights.length > 0 && (
                  <div>
                    <h2 className="mb-3 font-semibold text-lg">Highlights</h2>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {tour.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {reviews.length > 0 && (
                  <div>
                    <h2 className="mb-3 font-semibold text-lg">Recent reviews</h2>
                    <div className="space-y-4">
                      {reviews.slice(0, 3).map((r) => (
                        <div key={r._id} className="rounded-xl border border-border p-4">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="font-medium text-sm">{r.userName}</span>
                            <StarRating rating={r.rating} size="sm" />
                          </div>
                          <p className="font-medium text-sm">{r.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Itinerary */}
            {tab === "Itinerary" && (
              <div className="space-y-4">
                {tour.itinerary.map((item) => (
                  <div key={item.day} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {item.day}
                      </div>
                      {item.day < tour.itinerary.length && (
                        <div className="mt-1 w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Included / Not Included */}
            {tab === "Included" && (
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="mb-3 font-semibold text-emerald-600 dark:text-emerald-400">
                    ✓ Included
                  </h3>
                  <ul className="space-y-2">
                    {tour.included.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold text-red-500 dark:text-red-400">
                    ✗ Not included
                  </h3>
                  <ul className="space-y-2">
                    {tour.notIncluded.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: booking card ── */}
          <aside className="lg:w-80 lg:shrink-0">
            <div className="sticky top-4 rounded-2xl border border-border bg-card p-6 shadow-lg">
              <div className="mb-4 text-center">
                <div className="text-sm text-muted-foreground">From</div>
                <div className="text-4xl font-black text-primary">
                  ${tour.price.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">per person</div>
              </div>

              {/* Available dates */}
              {availableSlots.length > 0 ? (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Next available dates
                  </p>
                  <ul className="space-y-1.5">
                    {availableSlots.slice(0, 4).map((slot) => {
                      const remaining = slot.totalSpots - slot.bookedSpots;
                      return (
                        <li
                          key={slot.date}
                          className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm"
                        >
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            {formatTravelDate(slot.date)}
                          </span>
                          <span
                            className={`text-xs font-medium ${remaining <= 3 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}
                          >
                            {remaining} left
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className="mb-4 rounded-lg bg-muted px-3 py-3 text-center text-sm text-muted-foreground">
                  No available dates
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleBookNow}
                disabled={availableSlots.length === 0}
              >
                {availableSlots.length === 0 ? "Sold Out" : "Book Now"}
              </Button>

              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Free cancellation up to 7 days before
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Small groups — max {tour.maxGroupSize} people
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
