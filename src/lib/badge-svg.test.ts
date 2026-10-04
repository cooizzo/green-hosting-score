import { describe, expect, it } from "vitest";
import { badgeAltText, escapeXml, renderGradeBadge, renderMissingBadge } from "./badge-svg";

describe("escapeXml", () => {
  it("escapes markup characters", () => {
    expect(escapeXml(`a&b<c>"'`)).toBe("a&amp;b&lt;c&gt;&quot;&apos;");
  });
});

describe("renderGradeBadge", () => {
  it("emits an SVG with the grade and escaped hostname", () => {
    const svg = renderGradeBadge({
      rating: "A+",
      hostname: "evil.com<script>",
      gco2e: 0.04,
    });
    expect(svg).toContain("<svg");
    expect(svg).toContain("A+");
    expect(svg).toContain("evil.com&lt;script&gt;");
    expect(svg).not.toContain("<script>");
  });
});

describe("renderMissingBadge", () => {
  it("returns a not-found SVG", () => {
    expect(renderMissingBadge()).toContain("score not found");
  });
});

describe("badgeAltText", () => {
  it("includes grade and host", () => {
    expect(badgeAltText({ rating: "B", hostname: "example.com", gco2e: 0.12 })).toMatch(/B/);
    expect(badgeAltText({ rating: "B", hostname: "example.com", gco2e: 0.12 })).toMatch(/example.com/);
  });
});
