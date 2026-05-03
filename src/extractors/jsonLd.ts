import type { CheerioAPI } from "cheerio";
import type { StructuredDataItem } from "../types.js";

export function extractJsonLd($: CheerioAPI): StructuredDataItem[] {
  const items: StructuredDataItem[] = [];

  $('script[type="application/ld+json"]').each((_i, el) => {
    const raw = $(el).text();
    if (raw.trim().length === 0) {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      items.push({ "@parseError": String(err) });
      return;
    }

    for (const item of toItems(parsed)) {
      items.push(item);
    }
  });

  return items;
}

function toItems(value: unknown): StructuredDataItem[] {
  if (Array.isArray(value)) {
    const out: StructuredDataItem[] = [];
    for (const entry of value) {
      for (const item of toItems(entry)) {
        out.push(item);
      }
    }
    return out;
  }
  if (value !== null && typeof value === "object") {
    return [value as StructuredDataItem];
  }
  return [
    {
      "@parseError": `Expected JSON-LD object, got ${value === null ? "null" : typeof value}`,
    },
  ];
}
