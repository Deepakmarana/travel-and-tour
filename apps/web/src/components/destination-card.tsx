import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import type { Destination } from "@/lib/api";

export function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link
      to="/tours"
      search={{ search: destination.name, category: "", page: 1 }}
      className="group block"
    >
      <div className="relative h-64 overflow-hidden rounded-xl">
        <img
          src={destination.coverImage}
          alt={destination.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-xl font-bold">{destination.name}</h3>
          <div className="mt-1 flex items-center gap-1 text-sm text-white/80">
            <MapPin className="h-3.5 w-3.5" />
            <span>{destination.country}</span>
            {destination.tourCount > 0 && (
              <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs backdrop-blur-sm">
                {destination.tourCount} tour{destination.tourCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
