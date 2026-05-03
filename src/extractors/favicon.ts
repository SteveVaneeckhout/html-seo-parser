import type { CheerioAPI } from "cheerio";
import type { FaviconEntry } from "../types.js";

const ICON_REL_TOKENS = new Set([
  "icon",
  "shortcut",
  "apple-touch-icon",
  "apple-touch-icon-precomposed",
  "mask-icon",
  "fluid-icon",
]);

export function extractFavicon($: CheerioAPI): FaviconEntry[] {
  const entries: FaviconEntry[] = [];

  $("link[rel]").each((_i, el) => {
    const rel = $(el).attr("rel");
    const href = $(el).attr("href");
    if (rel === undefined || href === undefined) return;

    const tokens = rel.trim().toLowerCase().split(/\s+/);
    if (!tokens.some((t) => ICON_REL_TOKENS.has(t))) return;

    const trimmedHref = href.trim();
    if (trimmedHref.length === 0) return;

    const sizes = $(el).attr("sizes");
    const type = $(el).attr("type");

    entries.push({
      href: trimmedHref,
      rel: rel.trim(),
      sizes: sizes !== undefined && sizes.trim().length > 0 ? sizes.trim() : null,
      type: type !== undefined && type.trim().length > 0 ? type.trim() : null,
      isDefault: false,
    });
  });

  if (!entries.some((e) => isRootFaviconIco(e.href))) {
    entries.push({
      href: "/favicon.ico",
      rel: "icon",
      sizes: null,
      type: null,
      isDefault: true,
    });
  }

  return entries;
}

const ROOT_FAVICON_ICO_RE = /^(?:https?:)?\/\/[^/]+\/favicon\.ico(?:[?#]|$)/i;

function isRootFaviconIco(href: string): boolean {
  if (href === "/favicon.ico") return true;
  return ROOT_FAVICON_ICO_RE.test(href);
}
