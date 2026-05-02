import { describe, it, expect } from "vitest";
import { validate, VOCAB_VERSION } from "../../src/validate/index.js";
import type { StructuredData, StructuredDataItem } from "../../src/index.js";

describe("validate", () => {
  it("exposes the bundled vocab version", () => {
    expect(typeof VOCAB_VERSION).toBe("string");
    expect(VOCAB_VERSION.length).toBeGreaterThan(0);
  });

  it("returns valid=true with no issues for a known-good item", () => {
    const item: StructuredDataItem = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Hello world",
    };
    const result = validate(item);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("warns on unknown @type", () => {
    const item: StructuredDataItem = {
      "@context": "https://schema.org",
      "@type": "Buggle",
    };
    const result = validate(item);
    expect(result.valid).toBe(true);
    expect(result.issues.find((i) => i.code === "unknown-type")?.type).toBe("Buggle");
  });

  it("warns on unknown property", () => {
    const item: StructuredDataItem = {
      "@context": "https://schema.org",
      "@type": "Article",
      somethingMadeUp: "x",
    };
    const result = validate(item);
    expect(result.issues.find((i) => i.code === "unknown-property")?.property).toBe(
      "somethingMadeUp",
    );
  });

  it("warns when property is not in the type's domain", () => {
    const item: StructuredDataItem = {
      "@context": "https://schema.org",
      "@type": "Person",
      cookingMethod: "Bake",
    };
    const result = validate(item);
    const issue = result.issues.find((i) => i.code === "property-not-in-domain");
    expect(issue).toBeDefined();
    expect(issue?.property).toBe("cookingMethod");
  });

  it("rescues a property via subtype walking (NewsArticle inherits from CreativeWork)", () => {
    const item: StructuredDataItem = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: "Top Story",
      author: { "@type": "Person", name: "Reporter" },
    };
    const result = validate(item);
    expect(
      result.issues.find((i) => i.code === "property-not-in-domain" && i.property === "headline"),
    ).toBeUndefined();
  });

  it("warns on range mismatch for nested item value", () => {
    const item: StructuredDataItem = {
      "@context": "https://schema.org",
      "@type": "Article",
      author: { "@type": "Place", name: "Wrong type" },
    };
    const result = validate(item);
    const issue = result.issues.find((i) => i.code === "range-mismatch");
    expect(issue).toBeDefined();
    expect(issue?.property).toBe("author");
  });

  it("emits a single info issue and skips deeper checks for non-Schema.org context", () => {
    const item: StructuredDataItem = {
      "@context": "https://example.com/vocab",
      "@type": "Article",
      somethingWeird: "x",
    };
    const result = validate(item);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.code).toBe("unknown-vocabulary");
  });

  it("strict mode promotes warnings to errors", () => {
    const item: StructuredDataItem = {
      "@context": "https://schema.org",
      "@type": "Buggle",
    };
    const result = validate(item, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.level).toBe("error");
  });

  it("traverses @graph entries", () => {
    const item: StructuredDataItem = {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Article", headline: "OK" } as StructuredDataItem,
        { "@type": "Person", cookingMethod: "Bake" } as StructuredDataItem,
      ],
    };
    const result = validate(item);
    expect(
      result.issues.some((i) => i.code === "property-not-in-domain" && i.path.includes("@graph")),
    ).toBe(true);
  });

  it("accepts a StructuredData buckets object as input", () => {
    const data: StructuredData = {
      jsonLd: [{ "@context": "https://schema.org", "@type": "Article" }],
      microdata: [{ "@type": "https://schema.org/Person" }],
      rdfa: [{ "@type": "https://schema.org/Organization" }],
    };
    const result = validate(data);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("uses bucket name and index in path for StructuredData input", () => {
    const data: StructuredData = {
      jsonLd: [{ "@context": "https://schema.org", "@type": "Buggle" }],
      microdata: [],
      rdfa: [],
    };
    const result = validate(data);
    expect(result.issues[0]?.path).toEqual(["jsonLd", 0, "@type"]);
  });

  it("uses numeric path for plain array input", () => {
    const result = validate([
      { "@context": "https://schema.org", "@type": "Buggle" } as StructuredDataItem,
    ]);
    expect(result.issues[0]?.path).toEqual([0, "@type"]);
  });

  it("recurses into nested items", () => {
    const item: StructuredDataItem = {
      "@context": "https://schema.org",
      "@type": "Article",
      author: { "@type": "Person", definitelyMadeUp: "x" } as StructuredDataItem,
    };
    const result = validate(item);
    const issue = result.issues.find(
      (i) => i.code === "unknown-property" && i.property === "definitelyMadeUp",
    );
    expect(issue).toBeDefined();
    expect(issue?.path).toContain("author");
  });

  describe("namespace equivalence (http and https)", () => {
    it('validates @context: "http://schema.org" identically to https', () => {
      const result = validate({
        "@context": "http://schema.org",
        "@type": "Article",
        headline: "x",
      } as StructuredDataItem);
      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('validates @context: "https://schema.org" successfully', () => {
      const result = validate({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "x",
      } as StructuredDataItem);
      expect(result.issues).toEqual([]);
    });

    it("validates microdata-style item with absolute http://schema.org/ @type and no context", () => {
      const result = validate({
        "@type": "http://schema.org/Person",
        name: "Ada",
      } as StructuredDataItem);
      expect(result.issues).toEqual([]);
    });

    it("validates bare @type (no context) when type exists in vocab", () => {
      const result = validate({
        "@type": "Person",
        name: "Ada",
      } as StructuredDataItem);
      expect(result.issues).toEqual([]);
    });
  });

  it("handles @context as an array containing schema.org", () => {
    const result = validate({
      "@context": ["https://schema.org", "https://other.example/vocab"],
      "@type": "Article",
    } as StructuredDataItem);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("handles @context as an object with @vocab", () => {
    const result = validate({
      "@context": { "@vocab": "https://schema.org/" },
      "@type": "Article",
    } as StructuredDataItem);
    expect(result.valid).toBe(true);
  });

  it("treats @context array without schema.org as unknown vocabulary", () => {
    const result = validate({
      "@context": ["https://example.com/v1", "https://example.com/v2"],
      "@type": "Article",
    } as StructuredDataItem);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.code).toBe("unknown-vocabulary");
  });

  it("treats @context as object without schema.org @vocab as unknown vocabulary", () => {
    const result = validate({
      "@context": { "@vocab": "https://example.com/" },
      "@type": "Article",
    } as StructuredDataItem);
    expect(result.issues[0]?.code).toBe("unknown-vocabulary");
  });

  it("treats item with no @context and no detectable @type as unknown vocabulary", () => {
    const result = validate({ name: "orphan" } as StructuredDataItem);
    expect(result.issues[0]?.code).toBe("unknown-vocabulary");
  });

  it("supports schema: CURIE prefix on type names", () => {
    const result = validate({
      "@context": "https://schema.org",
      "@type": "schema:Article",
      headline: "x",
    } as StructuredDataItem);
    expect(result.issues).toEqual([]);
  });

  it("validates a single-value property whose value is not a nested item", () => {
    const result = validate({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Plain string headline",
    } as StructuredDataItem);
    expect(result.issues).toEqual([]);
  });

  it("validates property with array of values", () => {
    const result = validate({
      "@context": "https://schema.org",
      "@type": "Recipe",
      recipeIngredient: ["flour", "sugar", "eggs"],
    } as StructuredDataItem);
    expect(result.issues).toEqual([]);
  });

  it("path uses index when value is in an array", () => {
    const result = validate({
      "@context": "https://schema.org",
      "@type": "Article",
      author: [
        { "@type": "Person", name: "OK" },
        { "@type": "Place", name: "Wrong" },
      ],
    } as StructuredDataItem);
    const issue = result.issues.find((i) => i.code === "range-mismatch");
    expect(issue?.path).toEqual([0, "author", 1]);
  });

  it("strict mode preserves info-level issues without promoting them", () => {
    const result = validate(
      {
        "@context": "https://example.com/vocab",
        "@type": "Article",
      } as StructuredDataItem,
      { strict: true },
    );
    expect(result.valid).toBe(true);
    expect(result.issues[0]?.level).toBe("info");
  });

  it("skips domain check when item has no @type", () => {
    const result = validate({
      "@context": "https://schema.org",
      name: "Ada",
    } as StructuredDataItem);
    expect(result.issues.find((i) => i.code === "property-not-in-domain")).toBeUndefined();
  });

  it("skips range check when nested item has no @type", () => {
    const result = validate({
      "@context": "https://schema.org",
      "@type": "Article",
      author: { name: "anonymous" },
    } as StructuredDataItem);
    expect(result.issues.find((i) => i.code === "range-mismatch")).toBeUndefined();
  });

  it("ignores non-object entries inside @graph", () => {
    const result = validate({
      "@context": "https://schema.org",
      "@graph": ["a string", 42, null, { "@type": "Article" }],
    } as StructuredDataItem);
    expect(result.valid).toBe(true);
  });

  it("supports @type as an array of valid types", () => {
    const result = validate({
      "@context": "https://schema.org",
      "@type": ["Article", "NewsArticle"],
      headline: "x",
    } as StructuredDataItem);
    expect(result.issues).toEqual([]);
  });

  it("treats bare unknown @type with no context as non-Schema.org", () => {
    const result = validate({ "@type": "Buggle", name: "x" } as StructuredDataItem);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.code).toBe("unknown-vocabulary");
  });
});
