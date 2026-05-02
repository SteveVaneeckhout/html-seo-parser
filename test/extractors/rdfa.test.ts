import { describe, it, expect } from "vitest";
import { load } from "cheerio";
import { extractRdfa } from "../../src/extractors/rdfa.js";

function extract(html: string) {
  return extractRdfa(load(html));
}

describe("extractRdfa", () => {
  it("extracts a simple item with vocab + typeof + property", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Person">
        <span property="name">Ada</span>
        <span property="email">ada@example.com</span>
      </div>
    `);
    expect(items).toHaveLength(1);
    expect(items[0]?.["@type"]).toBe("https://schema.org/Person");
    expect(items[0]?.["https://schema.org/name"]).toBe("Ada");
    expect(items[0]?.["https://schema.org/email"]).toBe("ada@example.com");
  });

  it("inherits vocab from an ancestor element", () => {
    const items = extract(`
      <body vocab="https://schema.org/">
        <div typeof="Person">
          <span property="name">Ada</span>
        </div>
      </body>
    `);
    expect(items[0]?.["@type"]).toBe("https://schema.org/Person");
    expect(items[0]?.["https://schema.org/name"]).toBe("Ada");
  });

  it("allows a descendant to override vocab for its own terms", () => {
    const items = extract(`
      <div vocab="https://example.com/" typeof="A">
        <span property="name">A-name</span>
        <div vocab="https://schema.org/" typeof="B" property="hasB">
          <span property="name">B-name</span>
        </div>
      </div>
    `);
    expect(items[0]?.["@type"]).toBe("https://example.com/A");
    expect(items[0]?.["https://example.com/name"]).toBe("A-name");
    const nested = items[0]?.["https://schema.org/hasB"] as {
      "@type": string;
      "https://schema.org/name": string;
    };
    expect(nested["@type"]).toBe("https://schema.org/B");
    expect(nested["https://schema.org/name"]).toBe("B-name");
  });

  it("nests typeof children via property", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Person">
        <span property="name">Ada</span>
        <div property="address" typeof="PostalAddress">
          <span property="streetAddress">10 Lane</span>
        </div>
      </div>
    `);
    expect(items).toHaveLength(1);
    const nested = items[0]?.["https://schema.org/address"] as {
      "@type": string;
      "https://schema.org/streetAddress": string;
    };
    expect(nested["@type"]).toBe("https://schema.org/PostalAddress");
    expect(nested["https://schema.org/streetAddress"]).toBe("10 Lane");
  });

  it("uses content attribute over text for property values", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Article">
        <span property="datePublished" content="2026-01-15">January 15, 2026</span>
      </div>
    `);
    expect(items[0]?.["https://schema.org/datePublished"]).toBe("2026-01-15");
  });

  it("falls back to text content for property values", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Person">
        <span property="name">  Ada Lovelace  </span>
      </div>
    `);
    expect(items[0]?.["https://schema.org/name"]).toBe("Ada Lovelace");
  });

  it("uses href on <a property> as the value", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Person">
        <a property="url" href="https://ada.example/">Ada's site</a>
      </div>
    `);
    expect(items[0]?.["https://schema.org/url"]).toBe("https://ada.example/");
  });

  it("uses src on <img property> as the value", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Person">
        <img property="image" src="/ada.jpg" alt="Ada">
      </div>
    `);
    expect(items[0]?.["https://schema.org/image"]).toBe("/ada.jpg");
  });

  it("supports prefix declarations and CURIE expansion", () => {
    const items = extract(`
      <div prefix="schema: http://schema.org/" typeof="schema:Person">
        <span property="schema:name">Ada</span>
      </div>
    `);
    expect(items[0]?.["@type"]).toBe("http://schema.org/Person");
    expect(items[0]?.["http://schema.org/name"]).toBe("Ada");
  });

  it("preserves typeof when no vocab is set (bare term)", () => {
    const items = extract(`
      <div typeof="Person"><span property="name">Ada</span></div>
    `);
    expect(items[0]?.["@type"]).toBe("Person");
    expect(items[0]?.["name"]).toBe("Ada");
  });

  it("treats rel as a URI-bearing property when carrying href", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Person">
        <a rel="sameAs" href="https://example.com/ada">Ada</a>
      </div>
    `);
    expect(items[0]?.["https://schema.org/sameAs"]).toBe("https://example.com/ada");
  });

  it("uses resource attr as @id on a typeof element", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Person" resource="#ada">
        <span property="name">Ada</span>
      </div>
    `);
    expect(items[0]?.["@id"]).toBe("#ada");
  });

  it("handles space-separated multi-token typeof", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Article NewsArticle">
        <span property="headline">Hello</span>
      </div>
    `);
    expect(items[0]?.["@type"]).toEqual([
      "https://schema.org/Article",
      "https://schema.org/NewsArticle",
    ]);
  });

  it("collects multiple property values into an array", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Recipe">
        <span property="recipeIngredient">flour</span>
        <span property="recipeIngredient">sugar</span>
      </div>
    `);
    expect(items[0]?.["https://schema.org/recipeIngredient"]).toEqual(["flour", "sugar"]);
  });

  it("treats space-separated property tokens as multiple property names", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Thing">
        <span property="name alternateName">Ada</span>
      </div>
    `);
    expect(items[0]?.["https://schema.org/name"]).toBe("Ada");
    expect(items[0]?.["https://schema.org/alternateName"]).toBe("Ada");
  });

  it("returns empty array when no typeof element is present", () => {
    expect(extract("<div>plain html</div>")).toEqual([]);
  });

  it("ignores property/rel that appears outside any typeof scope", () => {
    const items = extract(`
      <span property="name">Orphan</span>
      <a rel="sameAs" href="https://example.com/">x</a>
    `);
    expect(items).toEqual([]);
  });

  it("absolute IRIs in typeof/property are preserved verbatim", () => {
    const items = extract(`
      <div typeof="https://schema.org/Person">
        <span property="https://schema.org/name">Ada</span>
      </div>
    `);
    expect(items[0]?.["@type"]).toBe("https://schema.org/Person");
    expect(items[0]?.["https://schema.org/name"]).toBe("Ada");
  });

  it("supports http schema.org vocab equivalently", () => {
    const items = extract(`
      <div vocab="http://schema.org/" typeof="Person">
        <span property="name">Ada</span>
      </div>
    `);
    expect(items[0]?.["@type"]).toBe("http://schema.org/Person");
    expect(items[0]?.["http://schema.org/name"]).toBe("Ada");
  });

  it("ignores rel without an href/resource/src target", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Person">
        <a rel="sameAs">no href</a>
      </div>
    `);
    expect(items[0]?.["https://schema.org/sameAs"]).toBeUndefined();
  });

  it("vocab attribute with empty string clears inherited vocab", () => {
    const items = extract(`
      <body vocab="https://schema.org/">
        <div vocab="" typeof="Person">
          <span property="name">x</span>
        </div>
      </body>
    `);
    expect(items[0]?.["@type"]).toBe("Person");
    expect(items[0]?.["name"]).toBe("x");
  });

  it("uses time datetime when property is on a time element", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Article">
        <time property="datePublished" datetime="2026-01-15">Jan 15</time>
      </div>
    `);
    expect(items[0]?.["https://schema.org/datePublished"]).toBe("2026-01-15");
  });

  it("uses object data when property is on an object element", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Thing">
        <object property="embedUrl" data="/embed.swf"></object>
      </div>
    `);
    expect(items[0]?.["https://schema.org/embedUrl"]).toBe("/embed.swf");
  });

  it("uses resource as fallback value on a property element", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Thing">
        <span property="sameAs" resource="https://example.com/"></span>
      </div>
    `);
    expect(items[0]?.["https://schema.org/sameAs"]).toBe("https://example.com/");
  });

  it("recognises CURIE in typeof attribute even when prefix is on an ancestor", () => {
    const items = extract(`
      <body prefix="schema: https://schema.org/">
        <div typeof="schema:Person">
          <span property="schema:name">x</span>
        </div>
      </body>
    `);
    expect(items[0]?.["@type"]).toBe("https://schema.org/Person");
  });

  it("ignores prefix tokens that are not key-value pairs", () => {
    const items = extract(`
      <div prefix="schema https://schema.org/" typeof="schema:Person">
        <span property="schema:name">x</span>
      </div>
    `);
    expect(items[0]?.["@type"]).toBe("schema:Person");
  });

  it("ignores property element with no value-bearing attributes and no text", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Thing">
        <span property="name"></span>
      </div>
    `);
    expect(items[0]?.["https://schema.org/name"]).toBe("");
  });

  it("ignores typeof with whitespace-only attribute (no @type)", () => {
    const items = extract(`<div typeof="   "></div>`);
    expect(items).toHaveLength(1);
    expect(items[0]?.["@type"]).toBeUndefined();
  });

  it("falls back to text on time property with no datetime attr", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Article">
        <time property="datePublished">2026-01-15</time>
      </div>
    `);
    expect(items[0]?.["https://schema.org/datePublished"]).toBe("2026-01-15");
  });

  it("falls back to text on a property with no href", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Person">
        <a property="name">No-href Ada</a>
      </div>
    `);
    expect(items[0]?.["https://schema.org/name"]).toBe("No-href Ada");
  });

  it("falls back to text on audio property with no src", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Person">
        <audio property="name">Fallback name</audio>
      </div>
    `);
    expect(items[0]?.["https://schema.org/name"]).toBe("Fallback name");
  });

  it("falls back to text on object property with no data attr", () => {
    const items = extract(`
      <div vocab="https://schema.org/" typeof="Thing">
        <object property="name">Object text</object>
      </div>
    `);
    expect(items[0]?.["https://schema.org/name"]).toBe("Object text");
  });
});
