import type { Element } from "domhandler";

/** Splits a whitespace-separated attribute value (itemtype, itemprop, typeof, rel…). */
export function splitTokens(value: string): string[] {
  return value
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

export function isElement(node: unknown): node is Element {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    (node as { type: unknown }).type === "tag"
  );
}
