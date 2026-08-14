import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { badgeAltText } from "@/lib/badge-svg";
import { publicAppUrl } from "@/lib/public-url";
import { CopyField } from "./copy-field";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatGridFootnote(label: string | null, intensity: number | null) {
  if (!label) return "—";
  const [bucket, country] = label.split(" · ");
  const words =
    bucket === "clean" ? "Cleaner than average" : bucket === "dirty" ? "Dirtier than average" : "About average";
  const place = country ? ` (${country})` : "";
  const grams = intensity != null ? ` · ${Math.round(intensity)} gCO₂/kWh` : "";
  return `${words}${place}${grams} — does not change the letter grade`;
}

export default async function ResultPage({ params }: Props) {
  const { slug } = await params;
  const result = await prisma.analysisResult.findUnique({ where: { slug } });
  if (!result) notFound();

  const fixes = Array.isArray(result.fixes) ? (result.fixes as string[]) : [];
  const origin = await publicAppUrl();
  const resultUrl = `${origin}/r/${result.slug}`;
  const badgeUrl = `${origin}/badge/${result.slug}.svg`;
  const alt = badgeAltText({
    rating: result.rating,
    hostname: result.hostname,
    gco2e: result.gco2e,
  });
  const htmlEmbed = `<a href="${resultUrl}"><img src="${badgeUrl}" alt="${alt}" /></a>`;
  const mdEmbed = `[![${alt}](${badgeUrl})](${resultUrl})`;

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
          <h2>Grid footnote</h2>
          <p>{formatGridFootnote(result.gridLabel, result.gridIntensity)}</p>
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

      <section className="share-embed">
        <h2>Share &amp; embed</h2>
        <p className="badge-preview">
          <a href={resultUrl}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgeUrl} alt={alt} height={20} />
          </a>
        </p>
        <CopyField label="HTML" value={htmlEmbed} />
        <CopyField label="Markdown" value={mdEmbed} />
        <p className="embed-docs">
          <Link href="/badge">How to embed the badge</Link>
        </p>
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
