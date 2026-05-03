import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button, buttonVariants } from "@travel-and-tour/ui/components/button";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { api, type Booking } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/payment-success")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) redirect({ to: "/login", throw: true });
    return { session };
  },
  validateSearch: z.object({
    session_id: z.string().optional(),
  }),
  component: PaymentSuccessComponent,
});

type ConfirmState =
  | { status: "confirming" }
  | { status: "success"; booking: Booking }
  | { status: "error"; message: string };

function PaymentSuccessComponent() {
  const navigate = useNavigate();
  const { session_id: sessionId } = Route.useSearch();
  const [state, setState] = useState<ConfirmState>({ status: "confirming" });

  useEffect(() => {
    let cancelled = false;

    if (!sessionId) {
      setState({ status: "error", message: "Missing checkout session ID." });
      return;
    }

    api.bookings
      .confirmCheckoutSession(sessionId)
      .then((booking) => {
        if (cancelled) return;

        setState({ status: "success", booking });
        toast.success("Payment received. Your booking is confirmed.");

        window.setTimeout(() => {
          if (!cancelled) {
            navigate({ to: "/dashboard" });
          }
        }, 1800);
      })
      .catch((error: Error) => {
        if (cancelled) return;

        setState({ status: "error", message: error.message });
        toast.error(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, sessionId]);

  return (
    <div className="mx-auto flex min-h-full max-w-2xl items-center px-6 py-12">
      <div className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        {state.status === "confirming" && (
          <>
            <LoaderCircle className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <h1 className="text-2xl font-bold">Confirming your payment</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We are verifying your Stripe checkout session and creating the booking now.
            </p>
          </>
        )}

        {state.status === "success" && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <h1 className="text-2xl font-bold">Booking confirmed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your payment was successful. We are taking you to your dashboard now.
            </p>
            <div className="mt-6 rounded-2xl bg-muted/40 p-4 text-left text-sm">
              <p>
                <span className="font-medium">Booking ID:</span> {state.booking._id}
              </p>
              <p className="mt-1">
                <span className="font-medium">Travellers:</span> {state.booking.travelers}
              </p>
              <p className="mt-1">
                <span className="font-medium">Total:</span> $
                {state.booking.totalPrice.toLocaleString()}
              </p>
            </div>
            <Button className="mt-6" onClick={() => navigate({ to: "/dashboard" })}>
              View my bookings
            </Button>
          </>
        )}

        {state.status === "error" && (
          <>
            <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h1 className="text-2xl font-bold">We could not confirm this booking</h1>
            <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/dashboard" className={buttonVariants({ variant: "outline" })}>
                Go to dashboard
              </Link>
              <Link
                to="/tours"
                search={{ search: "", category: "", page: 1 }}
                className={buttonVariants()}
              >
                Browse tours
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
