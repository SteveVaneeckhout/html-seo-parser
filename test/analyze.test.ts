import { describe, it, expect } from "vitest";
import { analyze } from "../src/index.js";

const FULL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Test Page Title</title>
  <meta name="description" content="A test page for SEO analysis">
  <meta name="keywords" content="seo, test, library">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Test Author">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <meta name="rating" content="general">
  <meta http-equiv="x-ua-compatible" content="IE=edge">
  <meta http-equiv="refresh" content="30">

  <meta property="og:title" content="OG Title">
  <meta property="og:description" content="OG Description">
  <meta property="og:image" content="https://example.com/image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Alt text for OG image">
  <meta property="og:url" content="https://example.com/page">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Example Site">
  <meta property="og:locale" content="en_US">
  <meta property="og:locale:alternate" content="fr_FR">
  <meta property="og:locale:alternate" content="de_DE">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Twitter Title">
  <meta name="twitter:description" content="Twitter Description">
  <meta name="twitter:image" content="https://example.com/twitter.jpg">
  <meta name="twitter:image:alt" content="Twitter image alt">
  <meta name="twitter:site" content="@examplesite">
  <meta name="twitter:creator" content="@author">

  <link rel="canonical" href="https://example.com/page">
  <link rel="alternate" hreflang="en" href="https://example.com/en">
  <link rel="alternate" hreflang="fr" href="https://example.com/fr">
  <link rel="alternate" hreflang="x-default" href="https://example.com/">
  <link rel="icon" href="/favicon.ico">
  <link rel="manifest" href="/site.webmanifest">
</head>
<body>
  <h1>Main Heading</h1>
  <p>Some text</p>
  <h2>Sub Heading One</h2>
  <p>More text</p>
  <h3>Deep Heading</h3>
  <h2>Sub Heading Two</h2>

  <img src="/hero.jpg" alt="Hero image" title="Hero" width="800" height="400" loading="lazy">
  <img src="/decorative.jpg" alt="" width="100" height="100">
  <img src="/no-alt.jpg" width="50" height="50">

  <a href="https://example.com/about" rel="nofollow" target="_blank">About Us</a>
  <a href="/contact">Contact</a>
  <a href="https://external.com" rel="nofollow noopener noreferrer">External</a>
</body>
</html>`;

const EMPTY_HTML = `<!DOCTYPE html><html><head></head><body></body></html>`;

const CHARSET_HTTP_EQUIV_HTML = `<!DOCTYPE html>
<html><head>
  <meta http-equiv="content-type" content="text/html; charset=ISO-8859-1">
</head><body></body></html>`;

const SHORTCUT_ICON_HTML = `<!DOCTYPE html>
<html><head>
  <link rel="shortcut icon" href="/favicon.png">
</head><body></body></html>`;

describe("analyze()", () => {
  describe("title", () => {
    it("extracts title text", () => {
      expect(analyze(FULL_HTML).title).toBe("Test Page Title");
    });

    it("returns null when title is absent", () => {
      expect(analyze(EMPTY_HTML).title).toBeNull();
    });

    it("returns null when title is whitespace-only", () => {
      expect(analyze("<html><head><title>   </title></head><body></body></html>").title).toBeNull();
    });
  });

  describe("metaTags", () => {
    it("extracts standard meta fields", () => {
      const { metaTags } = analyze(FULL_HTML);
      expect(metaTags.description).toBe("A test page for SEO analysis");
      expect(metaTags.keywords).toBe("seo, test, library");
      expect(metaTags.robots).toBe("index, follow");
      expect(metaTags.author).toBe("Test Author");
      expect(metaTags.viewport).toBe("width=device-width, initial-scale=1");
      expect(metaTags.referrer).toBe("no-referrer");
      expect(metaTags.rating).toBe("general");
    });

    it("extracts http-equiv directives", () => {
      const { metaTags } = analyze(FULL_HTML);
      expect(metaTags.httpEquiv.xUaCompatible).toBe("IE=edge");
      expect(metaTags.httpEquiv.refresh).toBe("30");
      expect(metaTags.httpEquiv.contentType).toBeNull();
    });

    it("returns nulls for absent meta fields", () => {
      const { metaTags } = analyze(EMPTY_HTML);
      expect(metaTags.description).toBeNull();
      expect(metaTags.keywords).toBeNull();
      expect(metaTags.robots).toBeNull();
    });

    it("matches meta name value case-insensitively", () => {
      const html = `<!DOCTYPE html><html><head>
        <meta name="Description" content="Capitalised name value">
        <meta name="ROBOTS" content="index, follow">
      </head><body></body></html>`;
      const { metaTags } = analyze(html);
      expect(metaTags.description).toBe("Capitalised name value");
      expect(metaTags.robots).toBe("index, follow");
    });
  });

  describe("openGraph", () => {
    it("extracts all OG properties", () => {
      const { openGraph } = analyze(FULL_HTML);
      expect(openGraph.title).toBe("OG Title");
      expect(openGraph.description).toBe("OG Description");
      expect(openGraph.image).toBe("https://example.com/image.jpg");
      expect(openGraph.imageWidth).toBe("1200");
      expect(openGraph.imageHeight).toBe("630");
      expect(openGraph.imageAlt).toBe("Alt text for OG image");
      expect(openGraph.url).toBe("https://example.com/page");
      expect(openGraph.type).toBe("website");
      expect(openGraph.siteName).toBe("Example Site");
      expect(openGraph.locale).toBe("en_US");
    });

    it("collects multiple og:locale:alternate values", () => {
      expect(analyze(FULL_HTML).openGraph.localeAlternate).toEqual(["fr_FR", "de_DE"]);
    });

    it("returns empty array for localeAlternate when none exist", () => {
      expect(analyze(EMPTY_HTML).openGraph.localeAlternate).toEqual([]);
    });

    it("filters out og:locale:alternate entries with empty or absent content", () => {
      const html = `<!DOCTYPE html><html><head>
        <meta property="og:locale:alternate" content="">
        <meta property="og:locale:alternate">
        <meta property="og:locale:alternate" content="fr_FR">
      </head><body></body></html>`;
      expect(analyze(html).openGraph.localeAlternate).toEqual(["fr_FR"]);
    });
  });

  describe("twitterCard", () => {
    it("extracts all Twitter Card properties", () => {
      const { twitterCard } = analyze(FULL_HTML);
      expect(twitterCard.card).toBe("summary_large_image");
      expect(twitterCard.title).toBe("Twitter Title");
      expect(twitterCard.description).toBe("Twitter Description");
      expect(twitterCard.image).toBe("https://example.com/twitter.jpg");
      expect(twitterCard.imageAlt).toBe("Twitter image alt");
      expect(twitterCard.site).toBe("@examplesite");
      expect(twitterCard.creator).toBe("@author");
    });
  });

  describe("canonical", () => {
    it("extracts canonical URL", () => {
      expect(analyze(FULL_HTML).canonical).toBe("https://example.com/page");
    });

    it("returns null when canonical is absent", () => {
      expect(analyze(EMPTY_HTML).canonical).toBeNull();
    });
  });

  describe("hreflang", () => {
    it("extracts all hreflang entries in order", () => {
      const { hreflang } = analyze(FULL_HTML);
      expect(hreflang).toHaveLength(3);
      expect(hreflang[0]).toEqual({ hreflang: "en", href: "https://example.com/en" });
      expect(hreflang[1]).toEqual({ hreflang: "fr", href: "https://example.com/fr" });
      expect(hreflang[2]).toEqual({ hreflang: "x-default", href: "https://example.com/" });
    });

    it("returns empty array when no hreflang links exist", () => {
      expect(analyze(EMPTY_HTML).hreflang).toEqual([]);
    });

    it("filters out entries with empty hreflang, missing href, or empty href", () => {
      const html = `<!DOCTYPE html><html><head>
        <link rel="alternate" hreflang="" href="https://example.com/">
        <link rel="alternate" hreflang="de">
        <link rel="alternate" hreflang="ja" href="">
      </head><body></body></html>`;
      expect(analyze(html).hreflang).toEqual([]);
    });
  });

  describe("headings", () => {
    it("extracts headings in DOM order with correct levels", () => {
      const { headings } = analyze(FULL_HTML);
      expect(headings).toHaveLength(4);
      expect(headings[0]).toEqual({ level: 1, text: "Main Heading", order: 0 });
      expect(headings[1]).toEqual({ level: 2, text: "Sub Heading One", order: 1 });
      expect(headings[2]).toEqual({ level: 3, text: "Deep Heading", order: 2 });
      expect(headings[3]).toEqual({ level: 2, text: "Sub Heading Two", order: 3 });
    });

    it("returns empty array when no headings exist", () => {
      expect(analyze(EMPTY_HTML).headings).toEqual([]);
    });
  });

  describe("images", () => {
    it("extracts image attributes", () => {
      const { images } = analyze(FULL_HTML);
      expect(images).toHaveLength(3);
      expect(images[0]).toEqual({
        src: "/hero.jpg",
        alt: "Hero image",
        title: "Hero",
        width: "800",
        height: "400",
        loading: "lazy",
      });
    });

    it("preserves empty alt string for decorative images", () => {
      expect(analyze(FULL_HTML).images[1]?.alt).toBe("");
    });

    it("returns null alt when alt attribute is absent", () => {
      expect(analyze(FULL_HTML).images[2]?.alt).toBeNull();
    });

    it("returns null for all absent attributes on a bare img", () => {
      const { images } = analyze("<html><head></head><body><img></body></html>");
      expect(images[0]).toEqual({
        src: null,
        alt: null,
        title: null,
        width: null,
        height: null,
        loading: null,
      });
    });
  });

  describe("links", () => {
    it("extracts link attributes", () => {
      const { links } = analyze(FULL_HTML);
      expect(links).toHaveLength(3);
      expect(links[0]).toEqual({
        href: "https://example.com/about",
        rel: "nofollow",
        text: "About Us",
        target: "_blank",
        kind: "http",
        isExternal: null,
        resolvedUrl: "https://example.com/about",
        likelyMissingProtocol: false,
      });
      expect(links[1]).toEqual({
        href: "/contact",
        rel: null,
        text: "Contact",
        target: null,
        kind: "http",
        isExternal: null,
        resolvedUrl: null,
        likelyMissingProtocol: false,
      });
      expect(links[2]).toMatchObject({ rel: "nofollow noopener noreferrer" });
    });

    it("returns null text for links with no text content", () => {
      const { links } = analyze(
        '<html><head></head><body><a href="/icon"><img src="x.png" alt="icon"></a></body></html>',
      );
      expect(links[0]?.text).toBeNull();
    });

    describe("classification", () => {
      const BASE = "https://mywebsite.com/about/";
      const link = (href: string, baseUrl?: string) =>
        analyze(`<html><body><a href="${href}">x</a></body></html>`, { baseUrl }).links[0]!;

      it("classifies link kinds by scheme and shape", () => {
        expect(link("mailto:hi@example.com").kind).toBe("email");
        expect(link("tel:+3212345678").kind).toBe("tel");
        expect(link("ftp://files.example.com/file.zip").kind).toBe("ftp");
        expect(link("ftps://files.example.com/file.zip").kind).toBe("ftp");
        expect(link("#section").kind).toBe("anchor");
        expect(link("javascript:void(0)").kind).toBe("other");
        expect(link("http://example.com/page").kind).toBe("http");
        expect(link("https://example.com/page").kind).toBe("http");
        expect(link("/relative").kind).toBe("http");
      });

      it("flags off-host http links as external", () => {
        expect(link("https://other.com/page", BASE).isExternal).toBe(true);
        expect(link("https://mywebsite.com/contact", BASE).isExternal).toBe(false);
        expect(link("/contact", BASE).isExternal).toBe(false);
      });

      it("treats different subdomains as external (exact host)", () => {
        expect(link("https://blog.mywebsite.com/post", BASE).isExternal).toBe(true);
      });

      it("returns null isExternal for non-http links and when base is unknown", () => {
        expect(link("mailto:hi@example.com", BASE).isExternal).toBeNull();
        expect(link("#section", BASE).isExternal).toBeNull();
        expect(link("/contact").isExternal).toBeNull();
      });

      it("returns null isExternal when the provided baseUrl is invalid", () => {
        const entry = link("/contact", "not a valid url");
        expect(entry.kind).toBe("http");
        expect(entry.isExternal).toBeNull();
        expect(entry.resolvedUrl).toBeNull();
      });

      it("resolves relative hrefs against the base URL", () => {
        expect(link("/contact", BASE).resolvedUrl).toBe("https://mywebsite.com/contact");
        expect(link("page.html", BASE).resolvedUrl).toBe("https://mywebsite.com/about/page.html");
        expect(link("https://example.com/x").resolvedUrl).toBe("https://example.com/x");
        expect(link("/contact").resolvedUrl).toBeNull();
      });

      it("flags a bare external domain written without a scheme", () => {
        const entry = link("www.example.com/contact", BASE);
        expect(entry.kind).toBe("http");
        expect(entry.likelyMissingProtocol).toBe(true);
        expect(entry.resolvedUrl).toBe("https://mywebsite.com/about/www.example.com/contact");
        expect(entry.isExternal).toBe(false);
      });

      it("flags bare domains and does not flag relative resources or paths", () => {
        expect(link("example.com").likelyMissingProtocol).toBe(true);
        expect(link("sub.example.co.uk/x").likelyMissingProtocol).toBe(true);
        expect(link("image.png").likelyMissingProtocol).toBe(false);
        expect(link("photo.avif").likelyMissingProtocol).toBe(false);
        expect(link("app.js").likelyMissingProtocol).toBe(false);
        expect(link("contact").likelyMissingProtocol).toBe(false);
        expect(link("/contact").likelyMissingProtocol).toBe(false);
        expect(link("#section").likelyMissingProtocol).toBe(false);
        expect(link("https://example.com").likelyMissingProtocol).toBe(false);
      });

      it("honors an in-page <base href> for resolution and external detection", () => {
        const html = `<html><head><base href="https://cdn.example.com/"></head>
          <body><a href="/asset">x</a></body></html>`;
        const entry = analyze(html, { baseUrl: BASE }).links[0]!;
        expect(entry.resolvedUrl).toBe("https://cdn.example.com/asset");
        expect(entry.isExternal).toBe(true);
      });

      describe("malformed / garbage hrefs", () => {
        it("degrades gracefully on unparseable absolute URLs (no throw)", () => {
          for (const href of ["http://", "https://", "http://[bad", "https://exa mple.com"]) {
            const entry = link(href, BASE);
            expect(entry.kind).toBe("http");
            expect(entry.resolvedUrl).toBeNull();
            expect(entry.isExternal).toBeNull();
            expect(entry.likelyMissingProtocol).toBe(false);
          }
        });

        it("treats empty and whitespace-only hrefs as the current document", () => {
          for (const href of ["", "   "]) {
            const entry = link(href, BASE);
            expect(entry.kind).toBe("http");
            expect(entry.resolvedUrl).toBe(BASE);
            expect(entry.isExternal).toBe(false);
            expect(entry.likelyMissingProtocol).toBe(false);
          }
        });

        it("trims surrounding whitespace before classifying", () => {
          const entry = link("  https://other.com/x  ", BASE);
          expect(entry.kind).toBe("http");
          expect(entry.resolvedUrl).toBe("https://other.com/x");
          expect(entry.isExternal).toBe(true);
        });

        it("classifies unknown or malformed schemes as other", () => {
          expect(link("weird-scheme://foo", BASE).kind).toBe("other");
          expect(link("about:blank", BASE).kind).toBe("other");
        });

        it("treats a leading colon (no valid scheme) as a relative path", () => {
          const entry = link(":broken", BASE);
          expect(entry.kind).toBe("http");
          expect(entry.resolvedUrl).toBe("https://mywebsite.com/about/:broken");
          expect(entry.isExternal).toBe(false);
          expect(entry.likelyMissingProtocol).toBe(false);
        });
      });
    });
  });

  describe("language", () => {
    it("extracts lang attribute from html element", () => {
      expect(analyze(FULL_HTML).language).toBe("en");
    });

    it("returns null when lang is absent", () => {
      expect(analyze(EMPTY_HTML).language).toBeNull();
    });
  });

  describe("charset", () => {
    it("extracts charset from meta charset attribute", () => {
      expect(analyze(FULL_HTML).charset).toBe("utf-8");
    });

    it("extracts charset from http-equiv content-type", () => {
      expect(analyze(CHARSET_HTTP_EQUIV_HTML).charset).toBe("ISO-8859-1");
    });

    it("returns null when charset is absent", () => {
      expect(analyze(EMPTY_HTML).charset).toBeNull();
    });

    it("returns null when http-equiv content-type has no charset parameter", () => {
      const html =
        '<html><head><meta http-equiv="content-type" content="text/html"></head><body></body></html>';
      expect(analyze(html).charset).toBeNull();
    });
  });

  describe("favicons", () => {
    it('extracts favicon from link rel="icon"', () => {
      const favicons = analyze(FULL_HTML).favicons;
      const declared = favicons.find((f) => !f.isDefault);
      expect(declared).toEqual({
        href: "/favicon.ico",
        rel: "icon",
        sizes: null,
        type: null,
        isDefault: false,
      });
    });

    it('extracts favicon from link rel="shortcut icon"', () => {
      const favicons = analyze(SHORTCUT_ICON_HTML).favicons;
      const declared = favicons.find((f) => !f.isDefault);
      expect(declared?.href).toBe("/favicon.png");
      expect(declared?.rel).toBe("shortcut icon");
    });

    it("returns only the synthetic /favicon.ico default when no link is declared", () => {
      const favicons = analyze(EMPTY_HTML).favicons;
      expect(favicons).toEqual([
        { href: "/favicon.ico", rel: "icon", sizes: null, type: null, isDefault: true },
      ]);
    });

    it("collects multiple icon links across rel variants with sizes/type", () => {
      const html = `<!DOCTYPE html><html><head>
        <link rel="icon" href="/icon-32.png" sizes="32x32" type="image/png">
        <link rel="apple-touch-icon" sizes="180x180" href="/apple.png">
        <link rel="mask-icon" href="/mask.svg" color="#000">
      </head><body></body></html>`;
      const favicons = analyze(html).favicons;
      // 3 declared + 1 synthetic /favicon.ico
      expect(favicons).toHaveLength(4);
      expect(favicons[0]).toMatchObject({
        href: "/icon-32.png",
        rel: "icon",
        sizes: "32x32",
        type: "image/png",
        isDefault: false,
      });
      expect(favicons[1]).toMatchObject({ rel: "apple-touch-icon", sizes: "180x180" });
      expect(favicons[2]).toMatchObject({ rel: "mask-icon" });
      expect(favicons[3]).toMatchObject({ href: "/favicon.ico", isDefault: true });
    });

    it("does not duplicate the synthetic default when /favicon.ico is already declared", () => {
      const html = `<!DOCTYPE html><html><head>
        <link rel="icon" href="/favicon.ico">
      </head><body></body></html>`;
      const favicons = analyze(html).favicons;
      expect(favicons).toHaveLength(1);
      expect(favicons[0]?.isDefault).toBe(false);
    });

    it("recognises absolute URLs ending in /favicon.ico as the default", () => {
      const html = `<!DOCTYPE html><html><head>
        <link rel="icon" href="https://example.com/favicon.ico">
      </head><body></body></html>`;
      const favicons = analyze(html).favicons;
      expect(favicons.some((f) => f.isDefault)).toBe(false);
      expect(favicons).toHaveLength(1);
    });

    it("recognises protocol-relative and query-suffixed /favicon.ico as the default", () => {
      const html = `<!DOCTYPE html><html><head>
        <link rel="icon" href="//cdn.example.com/favicon.ico?v=2">
      </head><body></body></html>`;
      const favicons = analyze(html).favicons;
      expect(favicons.some((f) => f.isDefault)).toBe(false);
      expect(favicons).toHaveLength(1);
    });

    it("does not match nested paths ending in favicon.ico", () => {
      const html = `<!DOCTYPE html><html><head>
        <link rel="icon" href="/assets/favicon.ico">
      </head><body></body></html>`;
      const favicons = analyze(html).favicons;
      expect(favicons).toHaveLength(2);
      expect(favicons[0]?.href).toBe("/assets/favicon.ico");
      expect(favicons[1]?.isDefault).toBe(true);
    });

    it("ignores link[rel] with no href attribute", () => {
      const html = `<!DOCTYPE html><html><head><link rel="icon"></head><body></body></html>`;
      const favicons = analyze(html).favicons;
      expect(favicons).toEqual([
        { href: "/favicon.ico", rel: "icon", sizes: null, type: null, isDefault: true },
      ]);
    });

    it("ignores icon links with whitespace-only href", () => {
      const html = `<!DOCTYPE html><html><head>
        <link rel="icon" href="   ">
      </head><body></body></html>`;
      const favicons = analyze(html).favicons;
      expect(favicons).toEqual([
        { href: "/favicon.ico", rel: "icon", sizes: null, type: null, isDefault: true },
      ]);
    });

    it("ignores link[rel] tokens that are not icon-related", () => {
      const html = `<!DOCTYPE html><html><head>
        <link rel="stylesheet" href="/main.css">
        <link rel="canonical" href="/page">
      </head><body></body></html>`;
      const favicons = analyze(html).favicons;
      expect(favicons).toEqual([
        { href: "/favicon.ico", rel: "icon", sizes: null, type: null, isDefault: true },
      ]);
    });
  });

  describe("manifestUrls", () => {
    it("extracts manifest URL from link rel=manifest", () => {
      expect(analyze(FULL_HTML).manifestUrls).toEqual(["/site.webmanifest"]);
    });

    it("returns empty array when manifest link is absent", () => {
      expect(analyze(EMPTY_HTML).manifestUrls).toEqual([]);
    });

    it("filters out entries where href is empty or whitespace-only", () => {
      const html = `<!DOCTYPE html><html><head><link rel="manifest" href="  "></head><body></body></html>`;
      expect(analyze(html).manifestUrls).toEqual([]);
    });

    it("ignores manifest links with no href attribute", () => {
      const html = `<!DOCTYPE html><html><head><link rel="manifest"></head><body></body></html>`;
      expect(analyze(html).manifestUrls).toEqual([]);
    });

    it("collects multiple manifest links so callers can flag the duplication", () => {
      const html = `<!DOCTYPE html><html><head>
        <link rel="manifest" href="/site.webmanifest">
        <link rel="manifest" href="/other.webmanifest">
      </head><body></body></html>`;
      expect(analyze(html).manifestUrls).toEqual(["/site.webmanifest", "/other.webmanifest"]);
    });
  });

  describe("structuredData", () => {
    const ALL_THREE_HTML = `<!DOCTYPE html>
<html>
<head>
  <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Article","headline":"JSON-LD Article"}
  </script>
</head>
<body>
  <div itemscope itemtype="https://schema.org/Person">
    <span itemprop="name">Microdata Ada</span>
  </div>
  <div vocab="https://schema.org/" typeof="Organization">
    <span property="name">RDFa Org</span>
  </div>
</body>
</html>`;

    it("populates all three buckets when each format is present", () => {
      const { structuredData } = analyze(ALL_THREE_HTML);
      expect(structuredData.jsonLd).toHaveLength(1);
      expect(structuredData.jsonLd[0]?.["@type"]).toBe("Article");
      expect(structuredData.microdata).toHaveLength(1);
      expect(structuredData.microdata[0]?.["@type"]).toBe("https://schema.org/Person");
      expect(structuredData.rdfa).toHaveLength(1);
      expect(structuredData.rdfa[0]?.["@type"]).toBe("https://schema.org/Organization");
    });

    it("returns empty buckets on plain HTML", () => {
      const { structuredData } = analyze(EMPTY_HTML);
      expect(structuredData.jsonLd).toEqual([]);
      expect(structuredData.microdata).toEqual([]);
      expect(structuredData.rdfa).toEqual([]);
    });
  });
});
