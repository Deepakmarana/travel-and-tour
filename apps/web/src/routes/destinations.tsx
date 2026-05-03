import { createFileRoute } from "@tanstack/react-router";
import { Globe, MapPin } from "lucide-react";

import { DestinationCard } from "@/components/destination-card";
import { api } from "@/lib/api";

export const Route = createFileRoute("/destinations")({
  loader: () => api.destinations.list(),
  component: DestinationsComponent,
});

function DestinationsComponent() {
  const destinations = Route.useLoaderData();
  const destinationMoments = destinations
    .flatMap((destination) =>
      [destination.coverImage, ...destination.images].map((src, index) => ({
        src,
        title: destination.name,
        subtitle: index === 0 ? destination.country : "Photo stop",
      })),
    )
    .slice(0, 5);

  return (
    <div className="overflow-y-auto">
      <div
        className="px-6 py-12 text-white"
        style={{
          background: "linear-gradient(135deg, oklch(0.2 0.14 240), oklch(0.3 0.18 255))",
        }}
      >
        <div className="mx-auto max-w-5xl text-center">
          <Globe className="mx-auto mb-3 h-10 w-10 opacity-80" />
          <h1 className="mb-2 text-4xl font-bold">Destinations</h1>
          <p className="text-white/70">
            Explore {destinations.length} breathtaking destinations across the globe
          </p>
        </div>
      </div>

      {destinationMoments.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative overflow-hidden rounded-[2rem] bg-card">
              <img
                src={destinationMoments[0]!.src}
                alt={destinationMoments[0]!.title}
                className="h-full min-h-80 w-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  {destinationMoments[0]!.subtitle}
                </p>
                <p className="mt-2 text-3xl font-semibold">{destinationMoments[0]!.title}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {destinationMoments.slice(1).map((moment) => (
                <div
                  key={`${moment.src}-${moment.title}`}
                  className="relative overflow-hidden rounded-[1.5rem] bg-card"
                >
                  <img
                    src={moment.src}
                    alt={moment.title}
                    className="h-48 w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/75 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/60">
                      {moment.subtitle}
                    </p>
                    <p className="mt-1 text-lg font-semibold">{moment.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((dest) => (
            <div key={dest._id} className="flex flex-col gap-3">
              <DestinationCard destination={dest} />
              <div className="px-1">
                <div className="mb-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {dest.country}
                  {dest.climate && <span className="ml-auto text-xs">| {dest.climate}</span>}
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{dest.description}</p>
                {dest.bestTimeToVisit && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Best time:</span>{" "}
                    {dest.bestTimeToVisit}
                  </p>
                )}
                {dest.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {dest.images.map((image, index) => (
                      <div key={`${dest._id}-${index}`} className="overflow-hidden rounded-xl">
                        <img
                          src={image}
                          alt={`${dest.name} view ${index + 1}`}
                          className="h-20 w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
