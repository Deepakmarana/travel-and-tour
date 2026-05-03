import { env } from "@travel-and-tour/env/web";

const BASE = env.VITE_SERVER_URL;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((data as { error: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvailabilitySlot {
  date: string;
  totalSpots: number;
  bookedSpots: number;
}

export interface ItineraryItem {
  day: number;
  title: string;
  description: string;
}

export interface Tour {
  _id: string;
  title: string;
  slug: string;
  description: string;
  destination: string;
  country: string;
  price: number;
  duration: number;
  maxGroupSize: number;
  difficulty: "easy" | "moderate" | "challenging";
  coverImage: string;
  images: string[];
  itinerary: ItineraryItem[];
  included: string[];
  notIncluded: string[];
  highlights: string[];
  availability: AvailabilitySlot[];
  averageRating: number;
  reviewCount: number;
  featured: boolean;
  category: "adventure" | "cultural" | "wildlife" | "beach" | "mountain" | "city";
  createdAt: string;
}

export interface Destination {
  _id: string;
  name: string;
  country: string;
  description: string;
  coverImage: string;
  images: string[];
  popular: boolean;
  climate?: string;
  bestTimeToVisit?: string;
  tourCount: number;
}

export interface Booking {
  _id: string;
  userId: string;
  tourId: Tour | string;
  date: string;
  travelers: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus?: "paid" | "unpaid" | "no_payment_required" | "refunded";
  paymentSessionId?: string;
  paymentIntentId?: string;
  currency?: string;
  specialRequests?: string;
  contactEmail: string;
  contactPhone?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  userId: string;
  tourId: string;
  rating: number;
  title: string;
  comment: string;
  userName: string;
  createdAt: string;
}

export type CheckoutSessionResponse =
  | { mode: "stripe"; url: string; sessionId: string }
  | { mode: "direct_booking"; booking: Booking; message: string };

// ─── API client ───────────────────────────────────────────────────────────────

export const api = {
  tours: {
    list: (params?: { category?: string; search?: string; page?: number }) =>
      apiFetch<{ tours: Tour[]; total: number; page: number; limit: number }>(
        `/api/tours${buildQuery(params)}`,
      ),
    featured: () => apiFetch<Tour[]>("/api/tours/featured"),
    detail: (id: string) => apiFetch<Tour>(`/api/tours/${id}`),
    reviews: (id: string) => apiFetch<Review[]>(`/api/tours/${id}/reviews`),
  },
  destinations: {
    list: () => apiFetch<Destination[]>("/api/destinations"),
    detail: (id: string) => apiFetch<Destination>(`/api/destinations/${id}`),
  },
  bookings: {
    list: () => apiFetch<(Booking & { tourId: Tour })[]>("/api/bookings"),
    createCheckoutSession: (data: {
      tourId: string;
      date: string;
      travelers: number;
      contactEmail: string;
      contactPhone?: string;
      specialRequests?: string;
    }) =>
      apiFetch<CheckoutSessionResponse>("/api/bookings/checkout-session", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    confirmCheckoutSession: (sessionId: string) =>
      apiFetch<Booking>(`/api/bookings/checkout-session/${sessionId}/confirm`, {
        method: "POST",
      }),
    create: (data: {
      tourId: string;
      date: string;
      travelers: number;
      contactEmail: string;
      contactPhone?: string;
      specialRequests?: string;
    }) => apiFetch<Booking>("/api/bookings", { method: "POST", body: JSON.stringify(data) }),
    cancel: (id: string) =>
      apiFetch<Booking>(`/api/bookings/${id}/cancel`, { method: "PATCH" }),
  },
  seed: () => apiFetch<{ message: string }>("/api/seed", { method: "POST" }),
};
