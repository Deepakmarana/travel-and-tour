import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Star, Users } from "lucide-react";

import type { Tour } from "@/lib/api";

const DIFFICULTY_STYLE: Record<Tour["difficulty"], string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  moderate: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  challenging: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

export function TourCard({ tour }: { tour: Tour }) {
  const hasSpots = tour.availability.some((s) => s.bookedSpots < s.totalSpots);

  return (
    <Link to="/tours/$tourId" params={{ tourId: tour._id }} className="group block">
      <div className="flex flex-col rounded-xl overflow-hidden bg-card ring-1 ring-border transition-all duration-200 hover:ring-primary/60 hover:shadow-xl hover:-translate-y-0.5">
        <div className="relative h-52 overflow-hidden">
          <img
            src={tour.coverImage}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${DIFFICULTY_STYLE[tour.difficulty]}`}
          >
            {tour.difficulty}
          </span>
          {!hasSpots && (
            <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-0.5 text-xs font-semibold text-white">
              Sold Out
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <h3 className="line-clamp-2 font-semibold leading-snug">{tour.title}</h3>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {tour.destination}, {tour.country}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {tour.duration}d
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              max&nbsp;{tour.maxGroupSize}
            </span>
            {tour.reviewCount > 0 && (
              <span className="ml-auto flex items-center gap-1 text-amber-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                {tour.averageRating.toFixed(1)}
                <span className="text-muted-foreground">({tour.reviewCount})</span>
              </span>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs capitalize text-muted-foreground">
              {tour.category}
            </span>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">from </span>
              <span className="text-lg font-bold text-primary">
                ${tour.price.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
