import type { AnyNode, Element, Text } from "domhandler";

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

/**
 * The text of a node and its descendants, like cheerio's `.text()`. cheerio recurses once per
 * nesting level and overflows the stack on deeply nested markup, so this walks with a stack.
 */
export function textContent(node: AnyNode): string {
  let text = "";
  const stack: AnyNode[] = [node];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current.type === "text") {
      text += (current as Text).data;
    } else if ("children" in current) {
      const { children } = current;
      for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]!);
    }
  }
  return text;
}
