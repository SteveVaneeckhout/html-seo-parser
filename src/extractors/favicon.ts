import type { CheerioAPI } from "cheerio";

export function extractFavicon($: CheerioAPI): string | null {
  const href = $('link[rel~="icon"]').first().attr("href");
  return href !== undefined && href.trim().length > 0 ? href.trim() : null;
}
