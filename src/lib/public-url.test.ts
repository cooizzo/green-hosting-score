import { describe, expect, it } from "vitest";
import { originFromHeaders } from "./public-url";

describe("originFromHeaders", () => {
  it("uses APP_URL when set", () => {
    expect(
      originFromHeaders({
        appUrl: "https://score.example/",
        host: "localhost:3000",
      }),
    ).toBe("https://score.example");
  });

  it("uses forwarded host from Caddy without a port", () => {
    expect(
      originFromHeaders({
        host: "localhost:3000",
        forwardedHost: "localhost",
        forwardedProto: "http",
      }),
    ).toBe("http://localhost");
  });

  it("keeps the port for local next dev", () => {
    expect(originFromHeaders({ host: "localhost:3000" })).toBe("http://localhost:3000");
  });
});
