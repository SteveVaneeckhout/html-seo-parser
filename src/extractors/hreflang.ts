import type { CheerioAPI } from "cheerio";
import type { HreflangEntry } from "../types.js";

export function extractHreflang($: CheerioAPI): HreflangEntry[] {
  const entries: HreflangEntry[] = [];
  $('link[rel="alternate"][hreflang]').each((_i, el) => {
    const hreflang = $(el).attr("hreflang")!;
    const href = $(el).attr("href");
    if (hreflang.trim().length > 0 && href !== undefined && href.trim().length > 0) {
      entries.push({ hreflang: hreflang.trim(), href: href.trim() });
    }
  });
  return entries;
}
