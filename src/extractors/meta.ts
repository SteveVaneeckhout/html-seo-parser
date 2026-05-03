import type { CheerioAPI } from "cheerio";
import type { MetaData } from "../types.js";

function getMetaByName($: CheerioAPI, name: string): string | null {
  const content = $(`meta[name="${name}" i]`).attr("content");
  return content !== undefined && content.trim().length > 0 ? content.trim() : null;
}

function getMetaByHttpEquiv($: CheerioAPI, equiv: string): string | null {
  const content = $(`meta[http-equiv="${equiv}" i]`).attr("content");
  return content !== undefined && content.trim().length > 0 ? content.trim() : null;
}

export function extractMeta($: CheerioAPI): MetaData {
  return {
    description: getMetaByName($, "description"),
    keywords: getMetaByName($, "keywords"),
    robots: getMetaByName($, "robots"),
    author: getMetaByName($, "author"),
    viewport: getMetaByName($, "viewport"),
    rating: getMetaByName($, "rating"),
    referrer: getMetaByName($, "referrer"),
    httpEquiv: {
      contentType: getMetaByHttpEquiv($, "content-type"),
      refresh: getMetaByHttpEquiv($, "refresh"),
      xUaCompatible: getMetaByHttpEquiv($, "x-ua-compatible"),
    },
  };
}
