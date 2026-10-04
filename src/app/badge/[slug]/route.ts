import { NextResponse } from "next/server";
import { renderGradeBadge, renderMissingBadge } from "@/lib/badge-svg";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

function normalizeSlug(raw: string): string | null {
  const slug = raw.toLowerCase().endsWith(".svg") ? raw.slice(0, -4) : raw;
  if (!/^[a-z0-9-]{3,80}$/i.test(slug)) return null;
  return slug;
}

function svgResponse(body: string, status: number) {
  return new NextResponse(body, {
    status,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": status === 200 ? "public, max-age=3600" : "no-store",
    },
  });
}

export async function GET(_req: Request, { params }: Params) {
  const { slug: raw } = await params;
  const slug = normalizeSlug(raw);
  if (!slug) {
    return svgResponse(renderMissingBadge(), 404);
  }

  const result = await prisma.analysisResult.findUnique({ where: { slug } });
  if (!result) {
    return svgResponse(renderMissingBadge(), 404);
  }

  const input = { rating: result.rating, hostname: result.hostname, gco2e: result.gco2e };
  const svg = renderGradeBadge(input);
  return svgResponse(svg, 200);
}
