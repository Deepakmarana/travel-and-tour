import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@travel-and-tour/ui/components/button";
import { ArrowRight, Globe, Map, Shield, Star, Users } from "lucide-react";
import { useState } from "react";

import { DestinationCard } from "@/components/destination-card";
import { TourCard } from "@/components/tour-card";
import { api } from "@/lib/api";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [featuredTours, destinations] = await Promise.all([
      api.tours.featured(),
      api.destinations.list(),
    ]);
    return { featuredTours, destinations };
  },
  component: HomeComponent,
});

function HomeComponent() {
  const { featuredTours, destinations } = Route.useLoaderData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const popular = destinations.filter((d) => d.popular);
  const heroShots = [
    ...featuredTours.slice(0, 2).map((tour) => ({
      src: tour.coverImage,
      title: tour.destination,
      subtitle: tour.title,
    })),
    ...popular.slice(0, 2).map((destination) => ({
      src: destination.images[0] ?? destination.coverImage,
      title: destination.name,
      subtitle: destination.country,
    })),
  ].slice(0, 3);
  const photoJournal = popular
    .flatMap((destination) =>
      [destination.coverImage, ...destination.images].map((src, index) => ({
        src,
        title: destination.name,
        subtitle: index === 0 ? destination.country : "Local view",
      })),
    )
    .slice(0, 5);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/tours", search: { search, category: "", page: 1 } });
  }

  return (
    <div className="overflow-y-auto">
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.15 0.12 240) 0%, oklch(0.25 0.18 250) 50%, oklch(0.18 0.14 270) 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
            style={{ background: "oklch(0.6 0.2 200)" }}
          />
          <div
            className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full opacity-15 blur-3xl"
            style={{ background: "oklch(0.55 0.18 260)" }}
          />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="max-w-3xl text-center lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur-sm">
              <Globe className="h-3.5 w-3.5" />
              <span>50+ destinations worldwide</span>
            </div>
            <h1 className="mb-4 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
              Discover the World
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.8 0.15 195), oklch(0.85 0.12 170))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Through Real Places
              </span>
            </h1>
            <p className="mb-10 text-lg text-white/70">
              Expertly guided tours to breathtaking destinations, with the scenery and stories to
              match before you even book.
            </p>

            <form
              onSubmit={handleSearch}
              className="mx-auto flex max-w-xl flex-col gap-2 rounded-[1.75rem] bg-white p-2 shadow-2xl lg:mx-0 sm:flex-row"
            >
              <input
                type="text"
                placeholder="Where do you want to go?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-2xl px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "oklch(0.47 0.19 243)" }}
              >
                Search
              </button>
            </form>
          </div>

          {heroShots.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 sm:grid-rows-2 lg:gap-4">
              {heroShots.map((shot, index) => (
                <div
                  key={`${shot.src}-${shot.title}`}
                  className={[
                    "group relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl",
                    index === 0 ? "min-h-72 sm:row-span-2 sm:min-h-112" : "min-h-44",
                  ].join(" ")}
                >
                  <img
                    src={shot.src}
                    alt={shot.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                      {shot.subtitle}
                    </p>
                    <p className="mt-1 text-xl font-semibold">{shot.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-x-12 gap-y-4 px-6 py-6">
          {[
            { icon: Map, value: "100+", label: "Expert-led tours" },
            { icon: Globe, value: "50+", label: "Destinations" },
            { icon: Users, value: "12,000+", label: "Happy travellers" },
            { icon: Star, value: "4.8/5", label: "Average rating" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-medium uppercase tracking-widest text-primary">
              Handpicked
            </p>
            <h2 className="text-3xl font-bold">Featured Tours</h2>
          </div>
          <Link to="/tours" search={{ search: "", category: "", page: 1 }}>
            <Button variant="outline" className="gap-2">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {featuredTours.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredTours.map((tour) => (
              <TourCard key={tour._id} tour={tour} />
            ))}
          </div>
        )}
      </section>

      {popular.length > 0 && (
        <section className="bg-muted/40 px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-sm font-medium uppercase tracking-widest text-primary">
                  Explore
                </p>
                <h2 className="text-3xl font-bold">Popular Destinations</h2>
              </div>
              <Link to="/destinations">
                <Button variant="outline" className="gap-2">
                  All destinations <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popular.slice(0, 6).map((dest) => (
                <DestinationCard key={dest._id} destination={dest} />
              ))}
            </div>
          </div>
        </section>
      )}

      {photoJournal.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8 max-w-2xl">
            <p className="mb-1 text-sm font-medium uppercase tracking-widest text-primary">
              Photo Journal
            </p>
            <h2 className="text-3xl font-bold">See the trip before you step on the plane</h2>
            <p className="mt-3 text-muted-foreground">
              A few scenes from the places travellers keep saving, sharing, and booking.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative overflow-hidden rounded-[2rem] bg-card">
              <img
                src={photoJournal[0]!.src}
                alt={photoJournal[0]!.title}
                className="h-full min-h-80 w-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  {photoJournal[0]!.subtitle}
                </p>
                <p className="mt-2 text-3xl font-semibold">{photoJournal[0]!.title}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {photoJournal.slice(1).map((shot) => (
                <div
                  key={`${shot.src}-${shot.title}`}
                  className="relative overflow-hidden rounded-[1.5rem] bg-card"
                >
                  <img src={shot.src} alt={shot.title} className="h-48 w-full object-cover" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/75 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/60">
                      {shot.subtitle}
                    </p>
                    <p className="mt-1 text-lg font-semibold">{shot.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="mb-1 text-sm font-medium uppercase tracking-widest text-primary">
            Simple
          </p>
          <h2 className="text-3xl font-bold">How It Works</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Choose your tour",
              desc: "Browse 100+ curated tours across 50+ destinations, filtered by style, duration, and budget.",
            },
            {
              step: "02",
              title: "Book with confidence",
              desc: "Pick your date and group size. Secure checkout with full transparency, with no hidden fees.",
            },
            {
              step: "03",
              title: "Travel and explore",
              desc: "Meet your expert local guide on the day. Everything is organised, so you can enjoy the journey.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div
                className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black text-white"
                style={{ background: "oklch(0.47 0.19 243)" }}
              >
                {step}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="px-6 py-20 text-center text-white"
        style={{
          background: "linear-gradient(135deg, oklch(0.47 0.19 243), oklch(0.35 0.18 270))",
        }}
      >
        <Shield className="mx-auto mb-4 h-10 w-10 opacity-80" />
        <h2 className="mb-3 text-3xl font-bold">Ready to start your adventure?</h2>
        <p className="mb-8 text-white/70">
          Join thousands of travellers who have discovered the world with us.
        </p>
        <Link to="/tours" search={{ search: "", category: "", page: 1 }}>
          <Button size="lg" className="gap-2 bg-white text-foreground hover:bg-white/90">
            Explore tours <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      <div className="h-8" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
      <Globe className="mx-auto mb-3 h-10 w-10 opacity-40" />
      <p className="font-medium">No tours yet</p>
      <p className="mt-1 text-sm">
        Seed the database at{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /api/seed</code>
      </p>
    </div>
  );
}
