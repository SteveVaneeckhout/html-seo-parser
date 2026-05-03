import { describe, it, expect } from "vitest";
import { load } from "cheerio";
import { extractJsonLd } from "../../src/extractors/jsonLd.js";

function extract(html: string) {
  return extractJsonLd(load(html));
}

describe("extractJsonLd", () => {
  it("extracts a single object root", () => {
    const html = `<script type="application/ld+json">
      {"@context":"https://schema.org","@type":"Article","headline":"Hello"}
    </script>`;
    const items = extract(html);
    expect(items).toEqual([
      { "@context": "https://schema.org", "@type": "Article", headline: "Hello" },
    ]);
  });

  it("flattens an array root into separate items", () => {
    const html = `<script type="application/ld+json">
      [
        {"@type":"Person","name":"Ada"},
        {"@type":"Person","name":"Grace"}
      ]
    </script>`;
    const items = extract(html);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ "@type": "Person", name: "Ada" });
    expect(items[1]).toMatchObject({ "@type": "Person", name: "Grace" });
  });

  it("preserves @graph verbatim (does not auto-flatten)", () => {
    const html = `<script type="application/ld+json">
      {"@context":"https://schema.org","@graph":[
        {"@type":"WebSite","name":"S"},
        {"@type":"Organization","name":"O"}
      ]}
    </script>`;
    const items = extract(html);
    expect(items).toHaveLength(1);
    expect(items[0]?.["@graph"]).toBeDefined();
    expect(Array.isArray(items[0]?.["@graph"])).toBe(true);
  });

  it("collects @parseError for malformed JSON without throwing", () => {
    const html = `<script type="application/ld+json">{ not valid json }</script>`;
    const items = extract(html);
    expect(items).toHaveLength(1);
    expect(typeof items[0]?.["@parseError"]).toBe("string");
  });

  it("skips empty and whitespace-only scripts", () => {
    const html = `
      <script type="application/ld+json"></script>
      <script type="application/ld+json">   </script>
    `;
    expect(extract(html)).toEqual([]);
  });

  it("collects items from multiple scripts in document order", () => {
    const html = `
      <script type="application/ld+json">{"@type":"A"}</script>
      <script type="application/ld+json">{"@type":"B"}</script>
    `;
    const items = extract(html);
    expect(items.map((i) => i["@type"])).toEqual(["A", "B"]);
  });

  it("preserves @type as string or array faithfully", () => {
    const html = `<script type="application/ld+json">
      [{"@type":"Article"},{"@type":["Article","NewsArticle"]}]
    </script>`;
    const items = extract(html);
    expect(items[0]?.["@type"]).toBe("Article");
    expect(items[1]?.["@type"]).toEqual(["Article", "NewsArticle"]);
  });

  it("emits @parseError for primitive roots (string/number/null)", () => {
    const html = `
      <script type="application/ld+json">"just a string"</script>
      <script type="application/ld+json">42</script>
      <script type="application/ld+json">null</script>
    `;
    const items = extract(html);
    expect(items).toHaveLength(3);
    expect(items[0]?.["@parseError"]).toMatch(/got string/);
    expect(items[1]?.["@parseError"]).toMatch(/got number/);
    expect(items[2]?.["@parseError"]).toMatch(/got null/);
  });

  it("emits @parseError for non-object entries inside an array root", () => {
    const html = `<script type="application/ld+json">
      [{"@type":"A"}, "stray", 7]
    </script>`;
    const items = extract(html);
    expect(items).toHaveLength(3);
    expect(items[0]?.["@type"]).toBe("A");
    expect(items[1]?.["@parseError"]).toMatch(/got string/);
    expect(items[2]?.["@parseError"]).toMatch(/got number/);
  });

  it("flattens nested arrays inside an array root", () => {
    const html = `<script type="application/ld+json">
      [{"@type":"A"},[{"@type":"B"},{"@type":"C"}]]
    </script>`;
    const items = extract(html);
    expect(items.map((i) => i["@type"])).toEqual(["A", "B", "C"]);
  });
});
