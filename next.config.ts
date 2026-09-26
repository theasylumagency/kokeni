import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Always render <title>, description, canonical and hreflang inside <head> before the body streams.
  // By default Next streams metadata into the body for crawlers that run JS (e.g. Googlebot);
  // non-rendering crawlers and AI fetchers then miss it. The TTFB cost is negligible here.
  htmlLimitedBots: /.*/,
  // URLs of the previous (Joomla) site that are still in Google's index. Redirect them to the
  // closest page on the new site so their link equity is kept and visitors don't hit a 404.
  async redirects() {
    // www.kokeni.ge → kokeni.ge (one hop, straight to the Georgian home for the bare domain).
    // Old directory links such as https://www.kokeni.ge/?ref=compania.ge land here. Requires the reverse
    // proxy to pass the original Host header (nginx: proxy_set_header Host $host).
    const www = [{ type: "host" as const, value: "www.kokeni.ge" }];
    return [
      { source: "/", has: www, destination: "https://kokeni.ge/ka", permanent: true },
      { source: "/:path+", has: www, destination: "https://kokeni.ge/:path+", permanent: true },
      { source: "/:lang(ka|en)/:id(\\d+)-uncategorised/:rest*", destination: "/:lang", permanent: true },
      { source: "/:lang(ka|en)/component/:rest*", destination: "/:lang", permanent: true },
      { source: "/component/:rest*", destination: "/ka", permanent: true },
      { source: "/index.php/:rest*", destination: "/ka", permanent: true },
      { source: "/index.php", destination: "/ka", permanent: true },
    ];
  },
};

export default nextConfig;
