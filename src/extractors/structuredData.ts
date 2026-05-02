import type { CheerioAPI } from "cheerio";
import type { StructuredData } from "../types.js";
import { extractJsonLd } from "./jsonLd.js";
import { extractMicrodata } from "./microdata.js";
import { extractRdfa } from "./rdfa.js";

export function extractStructuredData($: CheerioAPI): StructuredData {
  return {
    jsonLd: extractJsonLd($),
    microdata: extractMicrodata($),
    rdfa: extractRdfa($),
  };
}
