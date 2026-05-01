import type { CheerioAPI } from "cheerio";
import type { TwitterCardData } from "../types.js";

function getTwitter($: CheerioAPI, name: string): string | null {
  const content = $(`meta[name="${name}"]`).attr("content");
  return content !== undefined && content.trim().length > 0 ? content.trim() : null;
}

export function extractTwitterCard($: CheerioAPI): TwitterCardData {
  return {
    card: getTwitter($, "twitter:card"),
    title: getTwitter($, "twitter:title"),
    description: getTwitter($, "twitter:description"),
    image: getTwitter($, "twitter:image"),
    imageAlt: getTwitter($, "twitter:image:alt"),
    site: getTwitter($, "twitter:site"),
    creator: getTwitter($, "twitter:creator"),
  };
}
