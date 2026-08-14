import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default async function ResultPage({ params }: Props) {
  const { slug } = await params;
  const result = await prisma.analysisResult.findUnique({ where: { slug } });
  if (!result) notFound();

  const fixes = Array.isArray(result.fixes) ? (result.fixes as string[]) : [];

  return (
    <main className="page result-page">
      <header className="topbar">
        <Link href="/" className="brand-link">
          Green Hosting Score
        </Link>
      </header>

      <section className="result-hero">
        <p className="eyebrow">{result.hostname}</p>
        <p className={`grade grade-${result.rating.replace("+", "plus")}`}>{result.rating}</p>
        <p className="lede">
          ~{result.gco2e.toFixed(3)} gCO₂e per load · {formatBytes(result.bytes)} transferred
        </p>
        {result.mocked && (
          <p className="badge-warn">Mock score — live Greencheck / Website Carbon skipped</p>
        )}
        {!result.mocked && (
          <p className="badge-warn">
            Green hosting and gCO₂e are live. Transfer size is still estimated until crawl / Playwright
            land.
          </p>
        )}
      </section>

      <section className="meta-grid">
        <div>
          <h2>Green hosting</h2>
          <p>{result.green ? "Likely green host" : "Not marked green"}</p>
        </div>
        <div>
          <h2>Mode</h2>
          <p>{result.mode}</p>
        </div>
        <div>
          <h2>Grid</h2>
          <p>
            {result.gridLabel ?? "—"}
            {result.gridIntensity != null ? ` · ${result.gridIntensity} gCO₂/kWh` : ""}
          </p>
        </div>
        <div>
          <h2>Cleaner than</h2>
          <p>{result.cleanerThan != null ? `${Math.round(result.cleanerThan * 100)}% of pages` : "—"}</p>
        </div>
      </section>

      <section className="fixes">
        <h2>Fixes</h2>
        <ol>
          {fixes.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ol>
      </section>

      <p className="muted">
        Source URL:{" "}
        <a href={result.url} rel="noreferrer" target="_blank">
          {result.url}
        </a>
      </p>
    </main>
  );
}
