const GRADE_COLORS: Record<string, { bg: string; fg: string }> = {
  "A+": { bg: "#7dcea0", fg: "#0f2a1f" },
  A: { bg: "#7dcea0", fg: "#0f2a1f" },
  B: { bg: "#a8d48a", fg: "#0f2a1f" },
  C: { bg: "#c4a35a", fg: "#0f2a1f" },
  D: { bg: "#d9894f", fg: "#1a1210" },
  E: { bg: "#e07a5f", fg: "#1a1210" },
  F: { bg: "#c45c4a", fg: "#f2f7f3" },
};

export type BadgeInput = {
  rating: string;
  hostname: string;
  gco2e: number;
};

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function renderGradeBadge(input: BadgeInput): string {
  const rating = input.rating || "?";
  const colors = GRADE_COLORS[rating] ?? { bg: "#7dcea0", fg: "#0f2a1f" };
  const host = truncate(input.hostname.replace(/^www\./, ""), 22);
  const left = 118;
  const right = rating.length > 1 ? 44 : 36;
  const width = left + right;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="Green Hosting Score ${escapeXml(rating)}">
  <title>Green Hosting Score ${escapeXml(rating)} · ${escapeXml(host)}</title>
  <rect width="${width}" height="20" rx="3" fill="#1a3d2c"/>
  <rect x="${left}" width="${right}" height="20" rx="3" fill="${colors.bg}"/>
  <rect x="${left}" width="8" height="20" fill="${colors.bg}"/>
  <g fill="#f2f7f3" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="6" y="14">${escapeXml(host)}</text>
  </g>
  <g fill="${colors.fg}" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11" font-weight="700">
    <text x="${left + right / 2}" y="14" text-anchor="middle">${escapeXml(rating)}</text>
  </g>
</svg>`.replace(/\n\s*/g, "\n");
}

export function renderMissingBadge(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="150" height="20" role="img" aria-label="Score not found">
  <rect width="150" height="20" rx="3" fill="#1a3d2c"/>
  <text x="75" y="14" text-anchor="middle" fill="#b7c9bc" font-family="Verdana,Geneva,sans-serif" font-size="11">score not found</text>
</svg>`;
}

/** Unused in the compact shield; kept so callers can show gCO2e in alt text. */
export function badgeAltText(input: BadgeInput): string {
  const grams = input.gco2e < 0.01 ? input.gco2e.toFixed(4) : input.gco2e.toFixed(3);
  return `Green Hosting Score ${input.rating} (${grams} gCO₂e) for ${input.hostname}`;
}
