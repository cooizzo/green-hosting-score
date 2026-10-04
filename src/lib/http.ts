export const USER_AGENT =
  "GreenHostingScore/0.1 (+https://github.com/cooizzo/green-hosting-score)";

export class ExternalApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ExternalApiError";
  }
}

export async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "user-agent": USER_AGENT,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "network error";
    throw new ExternalApiError(`Request failed: ${reason}`);
  }

  if (!res.ok) {
    throw new ExternalApiError(`Request failed with status ${res.status}`, res.status);
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new ExternalApiError("Response was not valid JSON");
  }
}
