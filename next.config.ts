import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Always render <title>, description, canonical and hreflang inside <head> before the body streams.
  // By default Next streams metadata into the body for crawlers that run JS (e.g. Googlebot);
  // non-rendering crawlers and AI fetchers then miss it. The TTFB cost is negligible here.
  htmlLimitedBots: /.*/,
  // URLs of the previous (Joomla) site that are still in Google's index. Redirect them to the
  // closest page on the new site so their link equity is kept and visitors don't hit a 404.
  async redirects() {
    return [
      { source: "/:lang(ka|en)/:id(\\d+)-uncategorised/:rest*", destination: "/:lang", permanent: true },
      { source: "/:lang(ka|en)/component/:rest*", destination: "/:lang", permanent: true },
      { source: "/component/:rest*", destination: "/ka", permanent: true },
      { source: "/index.php/:rest*", destination: "/ka", permanent: true },
      { source: "/index.php", destination: "/ka", permanent: true },
    ];
  },
};

export default nextConfig;
