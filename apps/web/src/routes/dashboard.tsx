import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "@travel-and-tour/ui/components/button";
import { Skeleton } from "@travel-and-tour/ui/components/skeleton";
import { Calendar, Clock, DollarSign, MapPin, Plane, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, type Booking, type Tour } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { formatTravelDate } from "@/lib/format-travel-date";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) redirect({ to: "/login", throw: true });
    return { session };
  },
  component: DashboardComponent,
});

type PopulatedBooking = Booking & { tourId: Tour };

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  cancelled: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
};

type TabKey = "upcoming" | "past" | "cancelled";

function DashboardComponent() {
  const { session } = Route.useRouteContext();
  const user = session.data!.user;
  const [bookings, setBookings] = useState<PopulatedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("upcoming");

  useEffect(() => {
    api.bookings
      .list()
      .then((data) => setBookings(data as PopulatedBooking[]))
      .catch(() => toast.error("Failed to load bookings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(bookingId: string) {
    await api.bookings.cancel(bookingId).catch((err: Error) => {
      toast.error(err.message);
      return null;
    });
    setBookings((prev) =>
      prev.map((b) => (b._id === bookingId ? { ...b, status: "cancelled" } : b)),
    );
    toast.success("Booking cancelled");
  }

  const now = new Date();

  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.date) >= now,
  );
  const past = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.date) < now,
  );
  const cancelled = bookings.filter((b) => b.status === "cancelled");

  const totalSpent = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "past", label: "Completed", count: past.length },
    { key: "cancelled", label: "Cancelled", count: cancelled.length },
  ];

  const shown = tab === "upcoming" ? upcoming : tab === "past" ? past : cancelled;

  return (
    <div className="overflow-y-auto">
      {/* Header */}
      <div
        className="px-6 py-10 text-white"
        style={{ background: "linear-gradient(135deg, oklch(0.2 0.14 240), oklch(0.3 0.18 255))" }}
      >
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold">Welcome back, {user.name.split(" ")[0]}!</h1>
          <p className="mt-1 text-white/70">{user.email}</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Plane,
              label: "Total trips",
              value: loading ? "—" : bookings.filter((b) => b.status !== "cancelled").length,
            },
            {
              icon: Calendar,
              label: "Upcoming",
              value: loading ? "—" : upcoming.length,
            },
            {
              icon: DollarSign,
              label: "Total spent",
              value: loading ? "—" : `$${totalSpent.toLocaleString()}`,
            },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                tab === t.key
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs ${
                    tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Booking list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
            <Plane className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p className="font-medium">No {tab} trips</p>
            {tab === "upcoming" && (
              <p className="mt-2 text-sm">
                <Link
                  to="/tours"
                  search={{ search: "", category: "", page: 1 }}
                  className="text-primary hover:underline"
                >
                  Browse tours
                </Link>{" "}
                to start planning your next adventure
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {shown.map((booking) => {
              const tour =
                typeof booking.tourId === "object" ? booking.tourId : null;
              return (
                <div
                  key={booking._id}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row"
                >
                  {tour && (
                    <div className="h-24 w-full overflow-hidden rounded-lg sm:w-32 sm:shrink-0">
                      <img
                        src={tour.coverImage}
                        alt={tour.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-snug">
                        {tour ? tour.title : "Tour"}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[booking.status] ?? ""}`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    {tour && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {tour.destination}, {tour.country}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatTravelDate(booking.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {booking.travelers} traveller{booking.travelers !== 1 ? "s" : ""}
                      </span>
                      <span className="font-medium text-foreground">
                        ${booking.totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {booking.status === "confirmed" && new Date(booking.date) >= now && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5 self-start text-destructive hover:bg-destructive/10"
                      onClick={() => handleCancel(booking._id)}
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
