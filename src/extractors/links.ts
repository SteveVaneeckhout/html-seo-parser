import type { CheerioAPI } from "cheerio";
import type { LinkEntry } from "../types.js";

export function extractLinks($: CheerioAPI): LinkEntry[] {
  const entries: LinkEntry[] = [];
  $("a[href]").each((_i, el) => {
    const $el = $(el);
    entries.push({
      href: $el.attr("href")!,
      rel: $el.attr("rel") ?? null,
      text: $el.text().trim() || null,
      target: $el.attr("target") ?? null,
    });
  });
  return entries;
}
