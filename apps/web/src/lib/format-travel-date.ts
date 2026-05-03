export function formatTravelDate(
  date: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...options,
  });
}
