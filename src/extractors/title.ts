import type { CheerioAPI } from "cheerio";

export function extractTitle($: CheerioAPI): string | null {
  const text = $("title").first().text().trim();
  return text.length > 0 ? text : null;
}
