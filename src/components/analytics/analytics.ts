/**
 * Framework-free GA4 event helpers for kokeni.ge.
 * All functions are safe to call when gtag is not loaded (dev / blocked by an ad-blocker): they no-op.
 */

export type GAParams = Record<string, unknown>;

export type GAItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_category2?: string;
  item_list_name?: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Send a GA4 event. */
export function track(event: string, params: GAParams = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const LOCALE_RE = /^\/(ka|en)(?:\/|$)/;
const HOME_RE = /^\/(ka|en)\/?$/;

const safeDecode = (s: string): string => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

const toSnake = (s: string): string => s.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");

/** data-ga-cta-id="x" → { cta_id: "x" } */
function paramsFromDataset(el: HTMLElement): GAParams {
  const out: GAParams = {};
  for (const [key, value] of Object.entries(el.dataset)) {
    if (key.startsWith("ga") && key !== "gaEvent" && value !== undefined) {
      out[toSnake(key.slice(2))] = value;
    }
  }
  return out;
}

/**
 * /ka/catalog/<category>/<collection>/<slug>  →  GA4 item.
 * Returns null for anything that is not a product URL.
 */
function itemFromPath(pathname: string, listName?: string): GAItem | null {
  const seg = pathname.split("/").filter(Boolean).map(safeDecode);
  if (seg[1] !== "catalog" || seg.length < 5) return null;
  const [, , category, collection, slug] = seg;
  return {
    item_id: slug,
    item_name: slug.replace(/-/g, " "),
    item_category: category,
    item_category2: collection,
    item_list_name: listName ?? category,
  };
}

/* ------------------------------------------------------------------ */
/* 1. Click tracking (one delegated listener, no per-component wiring) */
/* ------------------------------------------------------------------ */

export function initClickTracking(): () => void {
  const onClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (!target?.closest) return;

    // a) Explicit: <button data-ga-event="cta_click" data-ga-cta-id="hero_project">
    //    (also used for the header account / cart icons: data-ga-event="ui_click" data-ga-ui-id="header_cart")
    const tagged = target.closest<HTMLElement>("[data-ga-event]");
    if (tagged?.dataset.gaEvent) {
      track(tagged.dataset.gaEvent, paramsFromDataset(tagged));
      return;
    }

    // b) Links
    const a = target.closest<HTMLAnchorElement>("a[href]");
    if (!a) return;
    const href = a.getAttribute("href") ?? "";

    // Phone → lead. Georgian landlines start with +995 3xx, mobiles with +995 5xx / 7xx.
    if (href.startsWith("tel:")) {
      const digits = href.replace(/[^\d+]/g, "");
      track("generate_lead", {
        method: digits.startsWith("+9953") ? "phone_landline" : "phone_mobile",
        link_url: href,
      });
      return;
    }

    // E-mail → lead
    if (href.startsWith("mailto:")) {
      track("generate_lead", { method: "email", link_url: href });
      return;
    }

    if (a.origin !== window.location.origin) return; // outbound clicks: GA4 Enhanced measurement does it

    // Language switch (link to the other locale)
    const current = LOCALE_RE.exec(window.location.pathname)?.[1];
    const next = LOCALE_RE.exec(a.pathname)?.[1];
    if (current && next && current !== next) {
      track("language_switch", { language: next });
      return;
    }

    // Catalog: category card or product card
    const path = safeDecode(a.pathname);
    const category = /^\/(?:ka|en)\/catalog\/([^/]+)\/?$/.exec(path)?.[1];
    if (category) {
      track("select_content", { content_type: "catalog_category", content_id: category });
      return;
    }
    const item = itemFromPath(a.pathname);
    if (item) {
      track("select_item", { item_list_name: item.item_category, items: [item] });
    }
  };

  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}

/* ------------------------------------------------------------------ */
/* 2. Home page: which "sheets" do visitors actually reach?            */
/* ------------------------------------------------------------------ */

// main > section order on the home page (Sheet 01–04) + footer (Sheet 05 = contact block).
// Override any of them with <section data-ga-section="my_name">.
const HOME_SECTIONS = ["hero", "capacity", "output", "directory"];

export function initHomeSectionTracking(pathname: string): () => void {
  if (!HOME_RE.test(pathname) || typeof IntersectionObserver === "undefined") return () => {};

  const targets: Array<[Element, string]> = [];
  document.querySelectorAll("main > section").forEach((el, i) => {
    targets.push([el, el.getAttribute("data-ga-section") ?? HOME_SECTIONS[i] ?? `section_${i + 1}`]);
  });
  const footer = document.querySelector("footer");
  if (footer) targets.push([footer, footer.getAttribute("data-ga-section") ?? "contact"]);

  const names = new Map<Element, string>(targets);
  const order = targets.map(([, name]) => name);

  // A section counts as "viewed" when it crosses the middle band of the viewport
  // (works for any section height, including tall sections on phones). Fires once per section.
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const name = names.get(entry.target);
        if (!name) continue;
        track("section_view", { section_id: name, section_index: order.indexOf(name) + 1 });
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
  );
  targets.forEach(([el]) => io.observe(el));
  return () => io.disconnect();
}

/* ------------------------------------------------------------------ */
/* 3. Catalog pages: view_item_list / view_item                        */
/* ------------------------------------------------------------------ */

export function trackCatalogPageView(pathname: string): () => void {
  const seg = pathname.split("/").filter(Boolean).map(safeDecode);
  if (seg[1] !== "catalog" || seg.length < 3) return () => {};

  // Wait a tick so the new page's DOM and <title> are in place.
  const timer = window.setTimeout(() => {
    if (document.title.startsWith("404")) return; // don't count not-found pages as item views

    if (seg.length >= 5) {
      const item = itemFromPath(pathname);
      if (item) track("view_item", { items: [item] });
      return;
    }

    // category (…/catalog/academic) or collection (…/catalog/academic/diploma-cover) page
    const listName = seg.slice(2, 4).join("/");
    const seen = new Set<string>();
    const items: GAItem[] = [];
    document.querySelectorAll<HTMLAnchorElement>("main a[href*='/catalog/']").forEach((a) => {
      const item = itemFromPath(a.pathname, listName);
      if (item && !seen.has(item.item_id)) {
        seen.add(item.item_id);
        items.push(item);
      }
    });
    track("view_item_list", { item_list_name: listName, items: items.slice(0, 50) });
  }, 400);

  return () => window.clearTimeout(timer);
}
