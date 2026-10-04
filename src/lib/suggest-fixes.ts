import type { MeasureResult } from "@/lib/measure-types";

function pushUnique(fixes: string[], text: string) {
  if (!fixes.includes(text)) fixes.push(text);
}

/**
 * Plain-language fixes from measured transfer, not generic page-weight guesses.
 */
export function suggestFixes(measured: MeasureResult): string[] {
  const fixes: string[] = [];

  if (measured.largestImageBytes > 200_000 || measured.imageBytes > 500_000) {
    pushUnique(
      fixes,
      "Compress or resize large images — they dominate transfer size.",
    );
  }

  if (measured.thirdPartyCount >= 4 || measured.thirdPartyBytes > 150_000) {
    pushUnique(fixes, "Defer non-critical third-party scripts until after first paint.");
  }

  if (measured.htmlCompressed === false) {
    pushUnique(fixes, "Enable Brotli/Gzip compression on HTML, CSS, and JS.");
  }

  if (measured.scriptBytes > 300_000) {
    pushUnique(fixes, "Split or defer JavaScript so the first load ships less script.");
  }

  if (measured.bytes > 1_500_000 && measured.imageBytes === 0) {
    pushUnique(fixes, "Audit what the page downloads on first load — transfer size is high.");
  }

  if (fixes.length < 3) {
    pushUnique(fixes, "Enable Brotli/Gzip compression on HTML, CSS, and JS.");
  }
  if (fixes.length < 3) {
    pushUnique(fixes, "Prefer system or subsetted fonts to cut font payload.");
  }
  if (fixes.length < 3) {
    pushUnique(fixes, "Remove unused CSS and scripts from the critical path.");
  }

  return fixes.slice(0, 3);
}
