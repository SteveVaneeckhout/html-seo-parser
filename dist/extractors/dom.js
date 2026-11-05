/** Splits a whitespace-separated attribute value (itemtype, itemprop, typeof, rel…). */
export function splitTokens(value) {
    return value
        .trim()
        .split(/\s+/)
        .filter((t) => t.length > 0);
}
export function isElement(node) {
    return (typeof node === "object" &&
        node !== null &&
        "type" in node &&
        node.type === "tag");
}
