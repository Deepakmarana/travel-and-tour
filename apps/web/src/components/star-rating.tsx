import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
}

export function StarRating({ rating, reviewCount, size = "md" }: StarRatingProps) {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={[
            size === "sm" ? "h-3 w-3" : "h-4 w-4",
            n <= filled
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted-foreground",
          ].join(" ")}
        />
      ))}
      {reviewCount !== undefined && (
        <span
          className={["text-muted-foreground", size === "sm" ? "text-xs" : "text-sm"].join(" ")}
        >
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
