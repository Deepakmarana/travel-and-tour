import { useForm } from "@tanstack/react-form";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@travel-and-tour/ui/components/button";
import { Input } from "@travel-and-tour/ui/components/input";
import { Label } from "@travel-and-tour/ui/components/label";
import { Calendar, ChevronLeft, Clock, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { formatTravelDate } from "@/lib/format-travel-date";

export const Route = createFileRoute("/book/$tourId")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) redirect({ to: "/login", throw: true });
    return { session };
  },
  loader: async ({ params }) => api.tours.detail(params.tourId),
  component: BookingComponent,
});

function BookingComponent() {
  const navigate = useNavigate();
  const tour = Route.useLoaderData();
  const { session } = Route.useRouteContext();

  const availableSlots = tour.availability.filter((slot) => slot.bookedSpots < slot.totalSpots);

  const form = useForm({
    defaultValues: {
      date: availableSlots[0]?.date
        ? new Date(availableSlots[0].date).toISOString().slice(0, 10)
        : "",
      travelers: 1,
      contactEmail: session.data?.user.email ?? "",
      contactPhone: "",
      specialRequests: "",
    },
    validators: {
      onSubmit: z.object({
        date: z.string().min(1, "Please select a date"),
        travelers: z.number().min(1, "At least 1 traveller").max(tour.maxGroupSize),
        contactEmail: z.email("Valid email required"),
        contactPhone: z.string(),
        specialRequests: z.string(),
      }),
    },
    onSubmit: async ({ value }) => {
      const checkout = await api.bookings
        .createCheckoutSession({
          tourId: tour._id,
          date: value.date,
          travelers: Number(value.travelers),
          contactEmail: value.contactEmail,
          contactPhone: value.contactPhone || undefined,
          specialRequests: value.specialRequests || undefined,
        })
        .catch((err: Error) => {
          toast.error(err.message);
          return null;
        });

      if (checkout) {
        if (checkout.mode === "stripe") {
          window.location.assign(checkout.url);
          return;
        }

        toast.success(checkout.message);
        navigate({ to: "/dashboard" });
      }
    },
  });

  return (
    <div className="overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 pt-4">
        <Link
          to="/tours/$tourId"
          params={{ tourId: tour._id }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to tour
        </Link>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-6">
        <h1 className="mb-6 text-2xl font-bold">Complete your booking</h1>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-5"
            >
              <form.Field name="date">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="date" className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Select date
                    </Label>
                    <select
                      id="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Choose a date</option>
                      {availableSlots.map((slot) => {
                        const remaining = slot.totalSpots - slot.bookedSpots;

                        return (
                          <option
                            key={slot.date}
                            value={new Date(slot.date).toISOString().slice(0, 10)}
                          >
                            {formatTravelDate(slot.date, {
                              weekday: "short",
                              month: "long",
                              day: "numeric",
                            })}{" "}
                            - {remaining} spot{remaining !== 1 ? "s" : ""} left
                          </option>
                        );
                      })}
                    </select>
                    {field.state.meta.errors.map((error) => (
                      <p key={error?.message} className="text-xs text-destructive">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>

              <form.Field name="travelers">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="travelers" className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Number of travellers
                    </Label>
                    <Input
                      id="travelers"
                      type="number"
                      min={1}
                      max={tour.maxGroupSize}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum group size: {tour.maxGroupSize}
                    </p>
                    {field.state.meta.errors.map((error) => (
                      <p key={error?.message} className="text-xs text-destructive">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>

              <form.Field name="contactEmail">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="contactEmail">Contact email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors.map((error) => (
                      <p key={error?.message} className="text-xs text-destructive">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>

              <form.Field name="contactPhone">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="contactPhone">
                      Phone number{" "}
                      <span className="text-xs text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="specialRequests">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="specialRequests">
                      Special requests{" "}
                      <span className="text-xs text-muted-foreground">(optional)</span>
                    </Label>
                    <textarea
                      id="specialRequests"
                      rows={3}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Dietary requirements, accessibility needs, celebrations..."
                      className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                )}
              </form.Field>

              <form.Subscribe
                selector={(state) => ({
                  canSubmit: state.canSubmit,
                  isSubmitting: state.isSubmitting,
                  travelers: Number(state.values.travelers) || 1,
                })}
              >
                {({ canSubmit, isSubmitting, travelers }) => {
                  const totalPrice = tour.price * travelers;

                  return (
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={!canSubmit || isSubmitting || availableSlots.length === 0}
                    >
                      {isSubmitting
                        ? "Redirecting to payment..."
                        : `Pay $${totalPrice.toLocaleString()} to book`}
                    </Button>
                  );
                }}
              </form.Subscribe>
            </form>
          </div>

          <form.Subscribe selector={(state) => Number(state.values.travelers) || 1}>
            {(travelers) => {
              const totalPrice = tour.price * travelers;

              return (
                <aside className="lg:w-72 lg:shrink-0">
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <h2 className="mb-4 font-semibold">Order summary</h2>

                    <div className="mb-4 overflow-hidden rounded-xl">
                      <img
                        src={tour.coverImage}
                        alt={tour.title}
                        className="h-36 w-full object-cover"
                      />
                    </div>
                    <p className="font-semibold leading-snug">{tour.title}</p>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {tour.destination}, {tour.country}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {tour.duration} days
                      </div>
                    </div>

                    <hr className="my-4 border-border" />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          ${tour.price.toLocaleString()} x {travelers} traveller
                          {travelers !== 1 ? "s" : ""}
                        </span>
                        <span>${totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Taxes & fees</span>
                        <span>Included</span>
                      </div>
                    </div>

                    <hr className="my-3 border-border" />

                    <div className="flex items-center justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary text-lg">${totalPrice.toLocaleString()}</span>
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground">
                      Free cancellation up to 7 days before the tour date.
                    </p>
                  </div>
                </aside>
              );
            }}
          </form.Subscribe>
        </div>
      </div>
    </div>
  );
}
