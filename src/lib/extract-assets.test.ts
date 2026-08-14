import { describe, expect, it } from "vitest";
import { extractAssetUrls, extractCssUrls, parseSrcset } from "./extract-assets";

describe("parseSrcset", () => {
  it("picks the last (usually largest) candidate", () => {
    expect(parseSrcset("small.jpg 480w, large.jpg 1200w")).toBe("large.jpg");
  });
});

describe("extractCssUrls", () => {
  it("resolves url() against the stylesheet base", () => {
    const css = `body { background: url("/img/bg.png"); } @font-face { src: url('../fonts/a.woff2'); }`;
    const urls = extractCssUrls(css, "https://example.com/css/app.css");
    expect(urls).toContain("https://example.com/img/bg.png");
    expect(urls).toContain("https://example.com/fonts/a.woff2");
  });

  it("skips data URLs", () => {
    expect(extractCssUrls("div{background:url(data:image/png;base64,abc)}", "https://example.com/")).toEqual([]);
  });
});

describe("extractAssetUrls", () => {
  it("collects stylesheets, scripts, and images but not navigation links", () => {
    const html = `
      <html>
        <head>
          <link rel="stylesheet" href="/app.css">
          <link rel="icon" href="/favicon.ico">
          <script src="https://cdn.example.com/lib.js"></script>
        </head>
        <body>
          <a href="/about">About</a>
          <img src="/hero.jpg" alt="">
          <img srcset="a.jpg 1x, b.jpg 2x">
        </body>
      </html>
    `;
    const { stylesheets, other } = extractAssetUrls(html, "https://example.com/page");
    expect(stylesheets).toEqual(["https://example.com/app.css"]);
    expect(other).toContain("https://example.com/favicon.ico");
    expect(other).toContain("https://cdn.example.com/lib.js");
    expect(other).toContain("https://example.com/hero.jpg");
    expect(other).toContain("https://example.com/b.jpg");
    expect(other.join(" ")).not.toContain("/about");
  });
});
