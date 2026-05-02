import { load } from "cheerio";
import type { SeoData } from "./types.js";
import { extractTitle } from "./extractors/title.js";
import { extractMeta } from "./extractors/meta.js";
import { extractOpenGraph } from "./extractors/openGraph.js";
import { extractTwitterCard } from "./extractors/twitterCard.js";
import { extractCanonical } from "./extractors/canonical.js";
import { extractHreflang } from "./extractors/hreflang.js";
import { extractHeadings } from "./extractors/headings.js";
import { extractImages } from "./extractors/images.js";
import { extractLinks } from "./extractors/links.js";
import { extractLanguage } from "./extractors/language.js";
import { extractCharset } from "./extractors/charset.js";
import { extractFavicon } from "./extractors/favicon.js";
import { extractStructuredData } from "./extractors/structuredData.js";

export function analyze(html: string): SeoData {
  const $ = load(html);

  return {
    title: extractTitle($),
    meta: extractMeta($),
    openGraph: extractOpenGraph($),
    twitterCard: extractTwitterCard($),
    canonical: extractCanonical($),
    hreflang: extractHreflang($),
    headings: extractHeadings($),
    images: extractImages($),
    links: extractLinks($),
    language: extractLanguage($),
    charset: extractCharset($),
    favicon: extractFavicon($),
    structuredData: extractStructuredData($),
  };
}
