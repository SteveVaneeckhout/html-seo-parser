import type { StructuredData, StructuredDataItem } from "../types.js";
export type StructuredDataSource = "jsonLd" | "microdata" | "rdfa";
export interface FlattenedItem extends StructuredDataItem {
  _source: StructuredDataSource;
}
export declare function flattenStructuredData(data: StructuredData): FlattenedItem[];
export declare function flattenGraph(items: StructuredDataItem[]): StructuredDataItem[];
