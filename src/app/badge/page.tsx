import Link from "next/link";

export default function BadgeDocsPage() {
  return (
    <main className="page result-page">
      <header className="topbar">
        <Link href="/" className="brand-link">
          Green Hosting Score
        </Link>
      </header>
      <section className="result-hero">
        <p className="eyebrow">Embed</p>
        <p className="lede">SVG grade badge</p>
        <p className="lede">
          Score a URL, then copy HTML or Markdown from the result page. The image is{" "}
          <code>/badge/&lt;slug&gt;.svg</code> and should link back to the result.
        </p>
      </section>
      <section className="share-embed">
        <h2>URL shape</h2>
        <pre className="embed-pre">/badge/example-com-xxxxxxxx.svg</pre>
        <h2>HTML</h2>
        <pre className="embed-pre">{`<a href="https://your-host/r/example-com-xxxxxxxx">
  <img src="https://your-host/badge/example-com-xxxxxxxx.svg" alt="Green Hosting Score" />
</a>`}</pre>
      </section>
    </main>
  );
}
