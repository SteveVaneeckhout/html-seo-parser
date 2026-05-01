import type { CheerioAPI } from "cheerio";

export function extractCanonical($: CheerioAPI): string | null {
  const href = $('link[rel="canonical"]').first().attr("href");
  return href !== undefined && href.trim().length > 0 ? href.trim() : null;
}
