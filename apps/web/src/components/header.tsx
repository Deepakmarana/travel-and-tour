import { Link } from "@tanstack/react-router";
import { Globe } from "lucide-react";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/tours" as const, label: "Tours" },
    { to: "/destinations" as const, label: "Destinations" },
    { to: "/dashboard" as const, label: "My Trips" },
  ];

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
            style={{ background: "oklch(0.47 0.19 243)" }}
          >
            <Globe className="h-4 w-4" />
          </div>
          <span>WanderBook</span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground [&.active]:font-semibold"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
