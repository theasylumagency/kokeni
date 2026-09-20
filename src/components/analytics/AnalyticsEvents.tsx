"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initClickTracking, initHomeSectionTracking, trackCatalogPageView } from "./analytics";

/**
 * Mount once in the root layout. Renders nothing.
 * Click events are delegated, so tel:/mailto:/catalog/language links are tracked with no per-component changes.
 */
export default function AnalyticsEvents() {
  const pathname = usePathname();

  useEffect(() => initClickTracking(), []);
  useEffect(() => initHomeSectionTracking(pathname), [pathname]);
  useEffect(() => trackCatalogPageView(pathname), [pathname]);

  return null;
}
