import type { CheerioAPI } from "cheerio";
import type { OpenGraphData } from "../types.js";

function getOgProp($: CheerioAPI, property: string): string | null {
  const content = $(`meta[property="${property}"]`).attr("content");
  return content !== undefined && content.trim().length > 0 ? content.trim() : null;
}

export function extractOpenGraph($: CheerioAPI): OpenGraphData {
  const localeAlternate: string[] = [];
  $('meta[property="og:locale:alternate"]').each((_i, el) => {
    const content = $(el).attr("content");
    if (content !== undefined && content.trim().length > 0) {
      localeAlternate.push(content.trim());
    }
  });

  return {
    title: getOgProp($, "og:title"),
    description: getOgProp($, "og:description"),
    image: getOgProp($, "og:image"),
    imageWidth: getOgProp($, "og:image:width"),
    imageHeight: getOgProp($, "og:image:height"),
    imageAlt: getOgProp($, "og:image:alt"),
    url: getOgProp($, "og:url"),
    type: getOgProp($, "og:type"),
    siteName: getOgProp($, "og:site_name"),
    locale: getOgProp($, "og:locale"),
    localeAlternate,
  };
}
