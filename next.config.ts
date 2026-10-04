import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@tgwf/co2", "playwright", "playwright-core", "cheerio"],
};

export default nextConfig;
