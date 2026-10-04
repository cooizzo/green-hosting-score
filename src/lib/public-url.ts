function firstHeader(value: string | null | undefined): string {
  return value?.split(",")[0]?.trim() ?? "";
}

function inferProto(host: string): string {
  const hostname = host.split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1" ? "http" : "https";
}

/** Public origin for share/badge links. Prefer APP_URL; otherwise the request Host. */
export function originFromHeaders(input: {
  appUrl?: string | null;
  host?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
}): string {
  const explicit = input.appUrl?.trim().replace(/\/$/, "");
  if (explicit) return explicit;

  const host = firstHeader(input.forwardedHost) || firstHeader(input.host);
  if (!host) return "http://localhost";

  const proto = firstHeader(input.forwardedProto) || inferProto(host);
  return `${proto}://${host}`;
}

export async function publicAppUrl(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  return originFromHeaders({
    appUrl: process.env.APP_URL,
    host: h.get("host"),
    forwardedHost: h.get("x-forwarded-host"),
    forwardedProto: h.get("x-forwarded-proto"),
  });
}
