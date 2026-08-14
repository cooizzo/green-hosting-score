import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeUrl, UrlGuardError } from "@/lib/analyze";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  url: z.string().min(1),
  mode: z.enum(["fast", "accurate"]).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { result, cached } = await analyzeUrl(parsed.data);
    return NextResponse.json({
      cached,
      result: {
        slug: result.slug,
        url: result.url,
        hostname: result.hostname,
        mode: result.mode,
        bytes: result.bytes,
        green: result.green,
        gco2e: result.gco2e,
        rating: result.rating,
        cleanerThan: result.cleanerThan,
        gridLabel: result.gridLabel,
        gridIntensity: result.gridIntensity,
        fixes: result.fixes,
        mocked: result.mocked,
        createdAt: result.createdAt,
        expiresAt: result.expiresAt,
      },
    });
  } catch (err) {
    if (err instanceof UrlGuardError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    logger.error({ err }, "analyze failed");
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
