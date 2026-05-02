import type { CheerioAPI } from "cheerio";

export function extractManifest($: CheerioAPI): string | null {
  const href = $('link[rel="manifest"]').first().attr("href");
  return href !== undefined && href.trim().length > 0 ? href.trim() : null;
}
