import { describe, expect, it } from "vitest";
import { emptyHints, type MeasureResult } from "./measure-types";
import { suggestFixes } from "./suggest-fixes";

function measured(partial: Partial<MeasureResult>): MeasureResult {
  return {
    bytes: 100_000,
    htmlBytes: 10_000,
    resourceCount: 5,
    mode: "fast",
    ...emptyHints("example.com"),
    ...partial,
  };
}

describe("suggestFixes", () => {
  it("calls out large images and third parties", () => {
    const fixes = suggestFixes(
      measured({
        largestImageBytes: 400_000,
        imageBytes: 800_000,
        thirdPartyCount: 6,
        thirdPartyBytes: 200_000,
        htmlCompressed: true,
      }),
    );
    expect(fixes[0]).toMatch(/images/i);
    expect(fixes[1]).toMatch(/third-party/i);
    expect(fixes).toHaveLength(3);
  });

  it("recommends compression when HTML was uncompressed", () => {
    const fixes = suggestFixes(measured({ htmlCompressed: false, bytes: 20_000 }));
    expect(fixes.some((f) => /Brotli|Gzip/i.test(f))).toBe(true);
  });
});
