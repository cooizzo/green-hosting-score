import { AnalyzeForm } from "./analyze-form";

export default function HomePage() {
  return (
    <main className="page home">
      <div className="hero-plane" aria-hidden />
      <div className="hero">
        <p className="brand">Green Hosting Score</p>
        <h1>How heavy is this page on the planet?</h1>
        <p className="support">
          Paste a URL for a letter grade, estimated gCO₂e, and whether hosting looks green.
        </p>
        <AnalyzeForm />
      </div>
    </main>
  );
}
