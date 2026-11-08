import type { CheerioAPI } from "cheerio";
import type { StructuredDataItem } from "../types.js";
/**
 * How deep items may nest inside items. Real pages stay far below this; the cap keeps
 * buildItem's recursion from overflowing the call stack on hostile markup.
 */
export declare const MAX_ITEM_DEPTH = 256;
export declare function extractMicrodata($: CheerioAPI): StructuredDataItem[];
