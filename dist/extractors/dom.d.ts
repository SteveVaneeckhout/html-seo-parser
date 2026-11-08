import type { AnyNode, Element } from "domhandler";
/** Splits a whitespace-separated attribute value (itemtype, itemprop, typeof, rel…). */
export declare function splitTokens(value: string): string[];
export declare function isElement(node: unknown): node is Element;
/**
 * The text of a node and its descendants, like cheerio's `.text()`. cheerio recurses once per
 * nesting level and overflows the stack on deeply nested markup, so this walks with a stack.
 */
export declare function textContent(node: AnyNode): string;
