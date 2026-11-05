import type { Element } from "domhandler";
/** Splits a whitespace-separated attribute value (itemtype, itemprop, typeof, rel…). */
export declare function splitTokens(value: string): string[];
export declare function isElement(node: unknown): node is Element;
