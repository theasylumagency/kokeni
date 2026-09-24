import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "ka"];
const defaultLocale = "ka";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/uploads")) {
    return NextResponse.next();
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
  // Permanent: the default locale never changes, and search engines should consolidate on /ka.
  return NextResponse.redirect(request.nextUrl, 308);
}

export const config = {
  // Skip Next internals, API, uploads and any path with a file extension
  // (robots.txt, sitemap.xml, llms.txt, site.webmanifest, icons, images) so they are served as-is.
  matcher: ["/((?!_next|public|videos|images|fonts|uploads|api|favicon.ico|.*\\..*).*)"],
};
