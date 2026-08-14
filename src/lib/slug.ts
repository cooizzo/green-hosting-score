import { customAlphabet } from "nanoid";

const nano = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

/** example.com → example-com */
export function hostnameToSlugBase(hostname: string): string {
  return hostname
    .toLowerCase()
    .replace(/^\.+|\.+$/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "site";
}

export function makeResultSlug(hostname: string): string {
  return `${hostnameToSlugBase(hostname)}-${nano()}`;
}
