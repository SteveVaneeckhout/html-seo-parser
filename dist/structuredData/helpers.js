export function flattenStructuredData(data) {
  const out = [];
  for (const item of data.jsonLd) out.push({ ...item, _source: "jsonLd" });
  for (const item of data.microdata) out.push({ ...item, _source: "microdata" });
  for (const item of data.rdfa) out.push({ ...item, _source: "rdfa" });
  return out;
}
export function flattenGraph(items) {
  const out = [];
  for (const item of items) {
    const graph = item["@graph"];
    if (Array.isArray(graph)) {
      for (const entry of graph) {
        if (isItem(entry)) out.push(entry);
      }
    } else {
      out.push(item);
    }
  }
  return out;
}
function isItem(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
