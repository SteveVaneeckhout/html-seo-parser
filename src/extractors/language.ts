import type { CheerioAPI } from "cheerio";

export function extractLanguage($: CheerioAPI): string | null {
  const lang = $("html").attr("lang");
  return lang !== undefined && lang.trim().length > 0 ? lang.trim() : null;
}
