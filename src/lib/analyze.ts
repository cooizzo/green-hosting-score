import { MeasureMode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { mockScore, type MeasureMode as AppMode } from "@/lib/mock-scorer";
import { makeResultSlug } from "@/lib/slug";
import { guardUrl, UrlGuardError } from "@/lib/url-guard";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type AnalyzeInput = {
  url: string;
  mode?: AppMode;
};

export async function analyzeUrl(input: AnalyzeInput) {
  const mode: AppMode = input.mode === "accurate" ? "accurate" : "fast";
  const safe = await guardUrl(input.url);

  const cached = await prisma.analysisResult.findFirst({
    where: {
      url: safe.href,
      mode: mode as MeasureMode,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (cached) {
    logger.info({ slug: cached.slug, mode }, "cache hit");
    return { result: cached, cached: true };
  }

  const useMock = process.env.MOCK_SCORER !== "false";
  if (!useMock) {
    // Phase 1+: real measure + Website Carbon + Greencheck
    throw new Error("Live scoring is not enabled yet; set MOCK_SCORER=true");
  }

  const score = mockScore(safe.href, mode);
  const slug = makeResultSlug(safe.hostname);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

  const result = await prisma.analysisResult.create({
    data: {
      slug,
      url: safe.href,
      hostname: safe.hostname,
      mode: mode as MeasureMode,
      bytes: score.bytes,
      green: score.green,
      gco2e: score.gco2e,
      rating: score.rating,
      cleanerThan: score.cleanerThan,
      gridLabel: score.gridLabel,
      gridIntensity: score.gridIntensity,
      fixes: score.fixes,
      mocked: score.mocked,
      expiresAt,
    },
  });

  logger.info({ slug, mode, rating: score.rating }, "analysis created");
  return { result, cached: false };
}

export { UrlGuardError };
