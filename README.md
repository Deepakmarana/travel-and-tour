# Travel & Tour

> Book tours, explore destinations.

A full-stack travel booking platform — 14 curated tours across 10 global destinations, with Stripe payments, user auth, and a booking dashboard.

![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
![Bun](https://img.shields.io/badge/Bun-1.3-fbf0df?style=flat&logo=bun&logoColor=black)

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, TanStack Router |
| Styling | Tailwind CSS v4, shadcn/ui |
| Backend | Express 5, Bun |
| Database | MongoDB, Mongoose |
| Auth | Better Auth |
| Payments | Stripe Checkout |
| Monorepo | Turborepo + Bun workspaces |

## Features

- Browse and filter 14 tours by destination, category, or search
- Destination pages with galleries and travel info
- Tour detail pages with itinerary, highlights, photo lightbox, and availability calendar
- Stripe Checkout (test mode ready)
- Sign up / sign in via Better Auth
- Booking dashboard for logged-in users
- Dark mode

## Project Structure

```
travel-and-tour/
├── apps/
│   ├── web/        # React frontend — localhost:3004
│   └── server/     # Express API — localhost:3000
└── packages/
    ├── db/         # Mongoose models & connection
    ├── ui/         # Shared shadcn/ui components
    ├── auth/       # Better Auth config
    ├── env/        # Zod-validated env variables
    └── config/     # Shared TS/tooling config
```

## Getting Started

**Prerequisites:** [Bun](https://bun.sh) v1.3+, MongoDB, Stripe account (test keys)

```bash
git clone https://github.com/your-username/tourbook.git
cd tourbook
bun install
```

### Environment Variables

**`apps/server/.env`**
```env
BETTER_AUTH_SECRET=your_random_secret_here
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3004
DATABASE_URL=mongodb://localhost:27017/travel-and-tour
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CURRENCY=usd
# STRIPE_WEBHOOK_SECRET=whsec_...
```

**`apps/web/.env`**
```env
VITE_SERVER_URL=http://localhost:3000
```

### Run

```bash
bun dev           # both apps
bun dev:web       # frontend only → http://localhost:3004
bun dev:server    # backend only  → http://localhost:3000
```

### Seed the Database

```bash
# macOS / Linux
curl -X POST http://localhost:3000/api/seed

# Windows (PowerShell)
Invoke-WebRequest -Uri "http://localhost:3000/api/seed" -Method POST
```

## API Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/tours` | List all tours |
| GET | `/api/tours/:id` | Tour detail |
| GET | `/api/destinations` | List all destinations |
| POST | `/api/bookings/checkout` | Create Stripe checkout session |
| GET | `/api/bookings` | User's bookings (auth required) |
| POST | `/api/seed` | Seed database (dev only) |
| ALL | `/api/auth/*` | Better Auth endpoints |

## Stripe Test Mode

| Field | Value |
|---|---|
| Card number | `4242 4242 4242 4242` |
| Expiry | Any future date |
| CVC | Any 3 digits |

## Scripts

| Script | Description |
|---|---|
| `bun dev` | Start all apps |
| `bun build` | Build all apps |
| `bun check-types` | TypeScript check across all packages |
