import { describe, it, expect } from "vitest";
import { flattenStructuredData, flattenGraph } from "../../src/index.js";
import type { StructuredData, StructuredDataItem } from "../../src/index.js";

describe("flattenStructuredData", () => {
  it("returns empty array when all buckets are empty", () => {
    const data: StructuredData = { jsonLd: [], microdata: [], rdfa: [] };
    expect(flattenStructuredData(data)).toEqual([]);
  });

  it("annotates each item with its source bucket", () => {
    const data: StructuredData = {
      jsonLd: [{ "@type": "A" }],
      microdata: [{ "@type": "B" }],
      rdfa: [{ "@type": "C" }],
    };
    const flat = flattenStructuredData(data);
    expect(flat).toHaveLength(3);
    expect(flat[0]?._source).toBe("jsonLd");
    expect(flat[1]?._source).toBe("microdata");
    expect(flat[2]?._source).toBe("rdfa");
    expect(flat[0]?.["@type"]).toBe("A");
  });

  it("does not mutate the input items", () => {
    const original: StructuredDataItem = { "@type": "A" };
    const data: StructuredData = { jsonLd: [original], microdata: [], rdfa: [] };
    flattenStructuredData(data);
    expect(original).not.toHaveProperty("_source");
  });
});

describe("flattenGraph", () => {
  it("inlines @graph items", () => {
    const items: StructuredDataItem[] = [
      {
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebSite", name: "S" } as StructuredDataItem,
          { "@type": "Organization", name: "O" } as StructuredDataItem,
        ],
      },
    ];
    const flat = flattenGraph(items);
    expect(flat).toHaveLength(2);
    expect(flat[0]?.["@type"]).toBe("WebSite");
    expect(flat[1]?.["@type"]).toBe("Organization");
  });

  it("passes through items that do not have @graph", () => {
    const items: StructuredDataItem[] = [{ "@type": "Article" }, { "@type": "Person" }];
    expect(flattenGraph(items)).toEqual(items);
  });

  it("filters out non-object @graph entries", () => {
    const items: StructuredDataItem[] = [
      {
        "@graph": [
          { "@type": "A" } as StructuredDataItem,
          "not an item" as unknown as StructuredDataItem,
          null as unknown as StructuredDataItem,
        ],
      },
    ];
    const flat = flattenGraph(items);
    expect(flat).toHaveLength(1);
    expect(flat[0]?.["@type"]).toBe("A");
  });
});
