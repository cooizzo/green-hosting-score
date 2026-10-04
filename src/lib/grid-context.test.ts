import { describe, expect, it } from "vitest";
import { formatGridLabel, labelFromIntensity, type GridContext } from "./grid-context";

describe("labelFromIntensity", () => {
  it("marks low-fossil low-intensity grids as clean", () => {
    expect(labelFromIntensity(40, 2)).toBe("clean");
  });

  it("marks high-fossil grids as dirty", () => {
    expect(labelFromIntensity(565, 83)).toBe("dirty");
  });

  it("uses intensity alone when fossil share is unknown", () => {
    expect(labelFromIntensity(442, null)).toBe("average");
    expect(labelFromIntensity(200, null)).toBe("clean");
    expect(labelFromIntensity(600, null)).toBe("dirty");
  });
});

describe("formatGridLabel", () => {
  it("appends country unless it is World", () => {
    const ctx: GridContext = { label: "clean", intensity: 45, country: "Norway", fossilPct: 2 };
    expect(formatGridLabel(ctx)).toBe("clean · Norway");
    expect(formatGridLabel({ ...ctx, country: "World" })).toBe("clean");
  });
});
