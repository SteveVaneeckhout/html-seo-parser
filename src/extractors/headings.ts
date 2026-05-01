import type { CheerioAPI } from "cheerio";
import type { HeadingEntry } from "../types.js";

const HEADING_SELECTOR = "h1, h2, h3, h4, h5, h6";

export function extractHeadings($: CheerioAPI): HeadingEntry[] {
  const entries: HeadingEntry[] = [];
  let order = 0;

  $(HEADING_SELECTOR).each((_i, el) => {
    const $el = $(el);
    const tagName = $el.prop("tagName") as string;
    const level = parseInt(tagName.slice(1), 10) as 1 | 2 | 3 | 4 | 5 | 6;
    entries.push({
      level,
      text: $el.text().trim(),
      order: order++,
    });
  });

  return entries;
}
