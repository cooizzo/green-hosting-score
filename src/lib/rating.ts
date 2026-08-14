/** Digital Carbon Rating thresholds (SWDM v4 / Website Carbon). */
const RATING_CEILINGS: { rating: string; maxGco2e: number }[] = [
  { rating: "A+", maxGco2e: 0.04 },
  { rating: "A", maxGco2e: 0.079 },
  { rating: "B", maxGco2e: 0.145 },
  { rating: "C", maxGco2e: 0.209 },
  { rating: "D", maxGco2e: 0.278 },
  { rating: "E", maxGco2e: 0.359 },
];

export const RATINGS = ["A+", "A", "B", "C", "D", "E", "F"] as const;
export type LetterRating = (typeof RATINGS)[number];

export function ratingFromGco2e(gco2e: number): LetterRating {
  for (const row of RATING_CEILINGS) {
    if (gco2e <= row.maxGco2e) return row.rating as LetterRating;
  }
  return "F";
}

export function normalizeRating(value: unknown, gco2e: number): LetterRating {
  if (typeof value === "string" && (RATINGS as readonly string[]).includes(value)) {
    return value as LetterRating;
  }
  return ratingFromGco2e(gco2e);
}
