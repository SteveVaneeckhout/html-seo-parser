import { describe, it, expect } from "vitest";
import { load } from "cheerio";
import { extractMicrodata } from "../../src/extractors/microdata.js";

function extract(html: string) {
  return extractMicrodata(load(html));
}

describe("extractMicrodata", () => {
  it("extracts a flat item with itemtype and properties", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Person">
        <span itemprop="name">Ada</span>
        <span itemprop="email">ada@example.com</span>
      </div>
    `);
    expect(items).toEqual([
      {
        "@type": "https://schema.org/Person",
        name: "Ada",
        email: "ada@example.com",
      },
    ]);
  });

  it("returns array @type for space-separated multi-token itemtype", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Person https://schema.org/Author">
        <span itemprop="name">Ada</span>
      </div>
    `);
    expect(items[0]?.["@type"]).toEqual(["https://schema.org/Person", "https://schema.org/Author"]);
  });

  it("omits @type when itemtype is missing", () => {
    const items = extract(`<div itemscope><span itemprop="name">x</span></div>`);
    expect(items[0]?.["@type"]).toBeUndefined();
    expect(items[0]?.["name"]).toBe("x");
  });

  it("captures itemid as @id", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Person" itemid="urn:isbn:1">
        <span itemprop="name">x</span>
      </div>
    `);
    expect(items[0]?.["@id"]).toBe("urn:isbn:1");
  });

  it("nests child itemscope as a nested item", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Person">
        <span itemprop="name">Ada</span>
        <div itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
          <span itemprop="streetAddress">10 Lane</span>
        </div>
      </div>
    `);
    expect(items).toHaveLength(1);
    const root = items[0]!;
    expect(root["name"]).toBe("Ada");
    const address = root["address"];
    expect(typeof address).toBe("object");
    expect((address as { "@type": string })["@type"]).toBe("https://schema.org/PostalAddress");
    expect((address as { streetAddress: string }).streetAddress).toBe("10 Lane");
  });

  it("collapses single property values; arrays multi values", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Recipe">
        <span itemprop="recipeIngredient">flour</span>
        <span itemprop="recipeIngredient">sugar</span>
        <span itemprop="recipeIngredient">eggs</span>
        <span itemprop="name">Cake</span>
      </div>
    `);
    expect(items[0]?.["recipeIngredient"]).toEqual(["flour", "sugar", "eggs"]);
    expect(items[0]?.["name"]).toBe("Cake");
  });

  it("treats space-separated itemprop as multiple property names", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing">
        <span itemprop="name alternateName">Ada Lovelace</span>
      </div>
    `);
    expect(items[0]?.["name"]).toBe("Ada Lovelace");
    expect(items[0]?.["alternateName"]).toBe("Ada Lovelace");
  });

  it("resolves itemref to elements outside the scope", () => {
    const items = extract(`
      <p id="bio" itemprop="description">Bio text</p>
      <div itemscope itemtype="https://schema.org/Person" itemref="bio">
        <span itemprop="name">Ada</span>
      </div>
    `);
    expect(items[0]?.["name"]).toBe("Ada");
    expect(items[0]?.["description"]).toBe("Bio text");
  });

  it("supports space-separated itemref with multiple ids", () => {
    const items = extract(`
      <p id="a" itemprop="description">A</p>
      <p id="b" itemprop="alternateName">B</p>
      <div itemscope itemtype="https://schema.org/Person" itemref="a b"></div>
    `);
    expect(items[0]?.["description"]).toBe("A");
    expect(items[0]?.["alternateName"]).toBe("B");
  });

  it("breaks circular itemscope references via itemref with @parseError", () => {
    const items = extract(`
      <div id="a" itemprop="self" itemscope itemtype="https://schema.org/Thing" itemref="b">
        <span itemprop="name">A</span>
      </div>
      <div id="b" itemprop="related" itemscope itemtype="https://schema.org/Thing" itemref="a">
        <span itemprop="name">B</span>
      </div>
    `);
    const a = items.find((i) => i["name"] === "A");
    expect(a).toBeDefined();
    const related = a!["related"] as { "@parseError"?: string; name?: string };
    expect(related.name).toBe("B");
    const back = related["self" as keyof typeof related] as { "@parseError"?: string } | undefined;
    expect(back?.["@parseError"]).toBeDefined();
  });

  it("extracts meta -> content", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing">
        <meta itemprop="name" content="Hidden Title">
      </div>
    `);
    expect(items[0]?.["name"]).toBe("Hidden Title");
  });

  it("extracts img -> src", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing">
        <img itemprop="image" src="/x.jpg" alt="x">
      </div>
    `);
    expect(items[0]?.["image"]).toBe("/x.jpg");
  });

  it("extracts a -> href", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing">
        <a itemprop="url" href="https://example.com/">Site</a>
      </div>
    `);
    expect(items[0]?.["url"]).toBe("https://example.com/");
  });

  it("extracts link -> href", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing">
        <link itemprop="sameAs" href="https://example.com/">
      </div>
    `);
    expect(items[0]?.["sameAs"]).toBe("https://example.com/");
  });

  it("extracts data -> value", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Product">
        <data itemprop="productID" value="abc-123">ABC</data>
      </div>
    `);
    expect(items[0]?.["productID"]).toBe("abc-123");
  });

  it("extracts meter -> value", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/AggregateRating">
        <meter itemprop="ratingValue" value="4.5">4.5 stars</meter>
      </div>
    `);
    expect(items[0]?.["ratingValue"]).toBe("4.5");
  });

  it("extracts time with datetime attr", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Article">
        <time itemprop="datePublished" datetime="2026-01-15">January 15</time>
      </div>
    `);
    expect(items[0]?.["datePublished"]).toBe("2026-01-15");
  });

  it("extracts time without datetime attr falls back to text", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Article">
        <time itemprop="datePublished">2026-01-15</time>
      </div>
    `);
    expect(items[0]?.["datePublished"]).toBe("2026-01-15");
  });

  it("extracts object -> data", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing">
        <object itemprop="embedUrl" data="/embed.swf"></object>
      </div>
    `);
    expect(items[0]?.["embedUrl"]).toBe("/embed.swf");
  });

  it("extracts source -> src", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/VideoObject">
        <source itemprop="contentUrl" src="/video.mp4">
      </div>
    `);
    expect(items[0]?.["contentUrl"]).toBe("/video.mp4");
  });

  it("extracts audio -> src", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/AudioObject">
        <audio itemprop="contentUrl" src="/audio.mp3"></audio>
      </div>
    `);
    expect(items[0]?.["contentUrl"]).toBe("/audio.mp3");
  });

  it("default value is trimmed text content", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing">
        <span itemprop="name">   Hello World   </span>
      </div>
    `);
    expect(items[0]?.["name"]).toBe("Hello World");
  });

  it("returns empty array when no items present", () => {
    expect(extract("<div>no microdata</div>")).toEqual([]);
  });

  it("ignores itemref pointing to a non-existent id", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing" itemref="nope">
        <span itemprop="name">x</span>
      </div>
    `);
    expect(items[0]?.["name"]).toBe("x");
  });

  it("returns empty value when source attribute is missing", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing">
        <meta itemprop="name">
      </div>
    `);
    expect(items[0]?.["name"]).toBe("");
  });

  it("does not double-visit elements via overlapping itemref + child traversal", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing" itemref="inside">
        <span id="inside" itemprop="name">x</span>
      </div>
    `);
    expect(items[0]?.["name"]).toBe("x");
  });

  it("only top-level itemscopes appear in the result; nested do not", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/A">
        <div itemprop="b" itemscope itemtype="https://schema.org/B">
          <span itemprop="name">B</span>
        </div>
      </div>
    `);
    expect(items).toHaveLength(1);
    expect(items[0]?.["@type"]).toBe("https://schema.org/A");
  });

  it("ignores itemref with empty token list", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing" itemref="   ">
        <span itemprop="name">x</span>
      </div>
    `);
    expect(items[0]?.["name"]).toBe("x");
  });

  it("ignores empty itemid", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing" itemid="   ">
        <span itemprop="name">x</span>
      </div>
    `);
    expect(items[0]?.["@id"]).toBeUndefined();
  });

  it("ignores empty itemtype (no @type)", () => {
    const items = extract(`
      <div itemscope itemtype="   ">
        <span itemprop="name">x</span>
      </div>
    `);
    expect(items[0]?.["@type"]).toBeUndefined();
  });

  it("ignores property elements with empty itemprop attribute", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing">
        <span itemprop=" ">ignored</span>
        <span itemprop="name">kept</span>
      </div>
    `);
    expect(items[0]?.["name"]).toBe("kept");
  });

  it("walks plain wrapper elements (no itemprop, no itemscope) into their children", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing">
        <div class="wrapper">
          <!-- a comment -->
          plain text node
          <span itemprop="name">found</span>
        </div>
      </div>
    `);
    expect(items[0]?.["name"]).toBe("found");
  });

  it("returns empty string when img itemprop has no src", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing">
        <img itemprop="image">
      </div>
    `);
    expect(items[0]?.["image"]).toBe("");
  });

  it("returns empty string when a itemprop has no href", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing">
        <a itemprop="url">no href</a>
      </div>
    `);
    expect(items[0]?.["url"]).toBe("");
  });

  it("returns empty string when object itemprop has no data attr", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing">
        <object itemprop="embedUrl"></object>
      </div>
    `);
    expect(items[0]?.["embedUrl"]).toBe("");
  });

  it("returns empty string when data itemprop has no value attr", () => {
    const items = extract(`
      <div itemscope itemtype="https://schema.org/Thing">
        <data itemprop="productID">no value attr</data>
      </div>
    `);
    expect(items[0]?.["productID"]).toBe("");
  });
});
