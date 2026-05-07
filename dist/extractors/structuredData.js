import { extractJsonLd } from "./jsonLd.js";
import { extractMicrodata } from "./microdata.js";
import { extractRdfa } from "./rdfa.js";
export function extractStructuredData($) {
  return {
    jsonLd: extractJsonLd($),
    microdata: extractMicrodata($),
    rdfa: extractRdfa($),
  };
}
