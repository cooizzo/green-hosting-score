"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type Mode = "fast" | "accurate";

export function AnalyzeForm() {
  const router = useRouter();
  const [url, setUrl] = useState("https://example.com");
  const [mode, setMode] = useState<Mode>("fast");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, mode }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Request failed");
          return;
        }
        router.push(`/r/${data.result.slug}`);
      } catch {
        setError("Network error");
      }
    });
  }

  return (
    <form className="analyze-form" onSubmit={onSubmit}>
      <label className="field">
        <span>Website URL</span>
        <input
          type="url"
          name="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          autoComplete="url"
        />
      </label>

      <fieldset className="mode">
        <legend>Measurement</legend>
        <label>
          <input
            type="radio"
            name="mode"
            checked={mode === "fast"}
            onChange={() => setMode("fast")}
          />
          Fast
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            checked={mode === "accurate"}
            onChange={() => setMode("accurate")}
          />
          Accurate
        </label>
      </fieldset>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Scoring…" : "Get score"}
      </button>
    </form>
  );
}
