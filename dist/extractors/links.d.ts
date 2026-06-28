import type { CheerioAPI } from "cheerio";
import type { LinkEntry } from "../types.js";
export declare function extractLinks($: CheerioAPI, resolveBase?: string, docUrl?: string): LinkEntry[];
