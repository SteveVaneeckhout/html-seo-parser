import type { StructuredData, StructuredDataItem } from "../types.js";

export type StructuredDataSource = "jsonLd" | "microdata" | "rdfa";

export interface FlattenedItem extends StructuredDataItem {
  _source: StructuredDataSource;
}

export function flattenStructuredData(data: StructuredData): FlattenedItem[] {
  const out: FlattenedItem[] = [];
  for (const item of data.jsonLd) out.push({ ...item, _source: "jsonLd" });
  for (const item of data.microdata) out.push({ ...item, _source: "microdata" });
  for (const item of data.rdfa) out.push({ ...item, _source: "rdfa" });
  return out;
}

export function flattenGraph(items: StructuredDataItem[]): StructuredDataItem[] {
  const out: StructuredDataItem[] = [];
  for (const item of items) {
    const graph = item["@graph"];
    if (Array.isArray(graph)) {
      for (const entry of graph) {
        if (isItem(entry)) out.push(entry);
      }
    } else {
      out.push(item);
    }
  }
  return out;
}

function isItem(value: unknown): value is StructuredDataItem {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
