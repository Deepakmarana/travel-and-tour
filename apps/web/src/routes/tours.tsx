import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import { TourCard } from "@/components/tour-card";
import { api } from "@/lib/api";

const CATEGORIES = ["adventure", "cultural", "wildlife", "beach", "mountain", "city"] as const;

export const Route = createFileRoute("/tours")({
  validateSearch: (search: Record<string, unknown>) => ({
    search: (search.search as string) ?? "",
    category: (search.category as string) ?? "",
    page: Number(search.page) || 1,
  }),
  loaderDeps: ({ search }) => ({
    q: search.search,
    category: search.category,
    page: search.page,
  }),
  loader: async ({ deps }) =>
    api.tours.list({
      search: deps.q || undefined,
      category: deps.category || undefined,
      page: deps.page,
    }),
  component: ToursComponent,
});

function ToursComponent() {
  const { tours, total, page, limit } = Route.useLoaderData();
  const { search: initSearch, category: initCategory } = Route.useSearch();
  const navigate = useNavigate({ from: "/tours" });

  const [searchInput, setSearchInput] = useState(initSearch);
  const totalPages = Math.ceil(total / limit);

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ search: (p) => ({ ...p, search: searchInput, page: 1 }) });
  }

  function setCategory(cat: string) {
    navigate({ search: (p) => ({ ...p, category: cat, page: 1 }) });
  }

  function clearFilters() {
    setSearchInput("");
    navigate({ search: { search: "", category: "", page: 1 } });
  }

  const hasFilters = initSearch || initCategory;

  return (
    <div className="overflow-y-auto">
      {/* Page header */}
      <div
        className="px-6 py-10 text-white"
        style={{ background: "linear-gradient(135deg, oklch(0.2 0.14 240), oklch(0.3 0.18 255))" }}
      >
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-2 text-4xl font-bold">Explore Tours</h1>
          <p className="text-white/70">
            {total} tour{total !== 1 ? "s" : ""} available worldwide
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Search + filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <form onSubmit={applySearch} className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search destination, tour name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </form>

          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(initCategory === cat ? "" : cat)}
                className={[
                  "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  initCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary",
                ].join(" ")}
              >
                {cat}
              </button>
            ))}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {tours.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
            <Search className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p className="font-medium">No tours found</p>
            <p className="mt-1 text-sm">Try a different search or clear the filters</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tours.map((tour) => (
              <TourCard key={tour._id} tour={tour} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() =>
                navigate({ search: (p) => ({ ...p, page: page - 1 }) })
              }
              className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() =>
                navigate({ search: (p) => ({ ...p, page: page + 1 }) })
              }
              className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
