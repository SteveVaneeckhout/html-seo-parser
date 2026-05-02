import { describe, it, expect } from "vitest";
import { ancestorTypes } from "../../src/validate/subtypeWalk.js";

describe("ancestorTypes", () => {
  it("includes the type itself in the ancestor set", () => {
    expect(ancestorTypes("Article").has("Article")).toBe(true);
  });

  it("walks the subtype chain to Thing", () => {
    const ancestors = ancestorTypes("NewsArticle");
    expect(ancestors.has("Article")).toBe(true);
    expect(ancestors.has("CreativeWork")).toBe(true);
    expect(ancestors.has("Thing")).toBe(true);
  });

  it("memoises results across calls (cache hit)", () => {
    const first = ancestorTypes("Person");
    const second = ancestorTypes("Person");
    expect(second).toBe(first);
  });

  it("returns a singleton set for unknown types", () => {
    const ancestors = ancestorTypes("DefinitelyNotARealType");
    expect(ancestors.size).toBe(1);
    expect(ancestors.has("DefinitelyNotARealType")).toBe(true);
  });

  it("deduplicates when walking diamond inheritance (multiple parents share an ancestor)", () => {
    // LocalBusiness extends both Organization and Place; both reach Thing
    const ancestors = ancestorTypes("LocalBusiness");
    expect(ancestors.has("Organization")).toBe(true);
    expect(ancestors.has("Place")).toBe(true);
    expect(ancestors.has("Thing")).toBe(true);
  });
});
