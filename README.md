# seotest

Parse an HTML string and extract all SEO-relevant data in one call. Fully typed, synchronous, zero config.

## Requirements

- Node.js ≥ 24.15.0
- ESM (`"type": "module"`)

## Installation

```sh
npm install seotest
```

## Usage

```ts
import { analyze } from "seotest";

const html = await fetch("https://example.com").then((r) => r.text());
const data = analyze(html);

console.log(data.title); // "Example Domain"
console.log(data.meta.description); // "An example site"
console.log(data.openGraph.image); // "https://example.com/og.jpg"
console.log(data.twitterCard.card); // "summary_large_image"
console.log(data.canonical); // "https://example.com/"
console.log(data.language); // "en"
console.log(data.charset); // "utf-8"
console.log(data.favicon); // "/favicon.ico"
console.log(data.hreflang); // [{ hreflang: "en", href: "..." }, ...]
console.log(data.headings); // [{ level: 1, text: "Hello", order: 0 }, ...]
console.log(data.images); // [{ src: "/img.jpg", alt: "...", ... }, ...]
console.log(data.links); // [{ href: "/about", rel: "nofollow", ... }, ...]
```

## API

### `analyze(html: string): SeoData`

Parses the HTML string and returns a [`SeoData`](#seedata) object. Synchronous.

## Return type

### `SeoData`

| Field            | Type                                  | Source                                                 |
| ---------------- | ------------------------------------- | ------------------------------------------------------ |
| `title`          | `string \| null`                      | `<title>`                                              |
| `meta`           | [`MetaData`](#metadata)               | `<meta name="...">` and `<meta http-equiv="...">`      |
| `openGraph`      | [`OpenGraphData`](#opengraphdata)     | `<meta property="og:*">`                               |
| `twitterCard`    | [`TwitterCardData`](#twittercarddata) | `<meta name="twitter:*">`                              |
| `canonical`      | `string \| null`                      | `<link rel="canonical">`                               |
| `hreflang`       | [`HreflangEntry[]`](#hreflangentry)   | `<link rel="alternate" hreflang="...">`                |
| `headings`       | [`HeadingEntry[]`](#headingentry)     | `<h1>` – `<h6>`                                        |
| `images`         | [`ImageEntry[]`](#imageentry)         | `<img>`                                                |
| `links`          | [`LinkEntry[]`](#linkentry)           | `<a href="...">`                                       |
| `language`       | `string \| null`                      | `<html lang="...">`                                    |
| `charset`        | `string \| null`                      | `<meta charset>` or `<meta http-equiv="content-type">` |
| `favicon`        | `string \| null`                      | `<link rel="icon">` / `rel="shortcut icon"`            |
| `structuredData` | [`StructuredData`](#structureddata)   | JSON-LD `<script>`, microdata, RDFa                    |

### `MetaData`

| Field                     | Type             | HTML source                           |
| ------------------------- | ---------------- | ------------------------------------- |
| `description`             | `string \| null` | `<meta name="description">`           |
| `keywords`                | `string \| null` | `<meta name="keywords">`              |
| `robots`                  | `string \| null` | `<meta name="robots">`                |
| `author`                  | `string \| null` | `<meta name="author">`                |
| `viewport`                | `string \| null` | `<meta name="viewport">`              |
| `rating`                  | `string \| null` | `<meta name="rating">`                |
| `referrer`                | `string \| null` | `<meta name="referrer">`              |
| `httpEquiv.contentType`   | `string \| null` | `<meta http-equiv="content-type">`    |
| `httpEquiv.refresh`       | `string \| null` | `<meta http-equiv="refresh">`         |
| `httpEquiv.xUaCompatible` | `string \| null` | `<meta http-equiv="x-ua-compatible">` |

### `OpenGraphData`

| Field             | Type             | `property` value                        |
| ----------------- | ---------------- | --------------------------------------- |
| `title`           | `string \| null` | `og:title`                              |
| `description`     | `string \| null` | `og:description`                        |
| `image`           | `string \| null` | `og:image`                              |
| `imageWidth`      | `string \| null` | `og:image:width`                        |
| `imageHeight`     | `string \| null` | `og:image:height`                       |
| `imageAlt`        | `string \| null` | `og:image:alt`                          |
| `url`             | `string \| null` | `og:url`                                |
| `type`            | `string \| null` | `og:type`                               |
| `siteName`        | `string \| null` | `og:site_name`                          |
| `locale`          | `string \| null` | `og:locale`                             |
| `localeAlternate` | `string[]`       | `og:locale:alternate` (all occurrences) |

### `TwitterCardData`

| Field         | Type             | `name` value          |
| ------------- | ---------------- | --------------------- |
| `card`        | `string \| null` | `twitter:card`        |
| `title`       | `string \| null` | `twitter:title`       |
| `description` | `string \| null` | `twitter:description` |
| `image`       | `string \| null` | `twitter:image`       |
| `imageAlt`    | `string \| null` | `twitter:image:alt`   |
| `site`        | `string \| null` | `twitter:site`        |
| `creator`     | `string \| null` | `twitter:creator`     |

### `HreflangEntry`

```ts
interface HreflangEntry {
  hreflang: string;
  href: string;
}
```

Entries with an empty `hreflang` or missing/empty `href` are omitted.

### `HeadingEntry`

```ts
interface HeadingEntry {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  order: number; // zero-based DOM appearance order
}
```

Headings are returned in DOM order. `order` can be used to reconstruct hierarchy.

### `ImageEntry`

```ts
interface ImageEntry {
  src: string | null;
  alt: string | null; // null = attribute absent (missing); "" = intentionally empty (decorative)
  title: string | null;
  width: string | null;
  height: string | null;
  loading: string | null;
}
```

The distinction between `alt: null` (attribute missing — an SEO/accessibility issue) and `alt: ""` (attribute present but empty — valid for decorative images) is preserved intentionally.

### `LinkEntry`

```ts
interface LinkEntry {
  href: string; // always present; anchors without href are excluded
  rel: string | null; // raw value, e.g. "nofollow noopener noreferrer"
  text: string | null; // null when the anchor has no text content
  target: string | null;
}
```

Only `<a href="...">` elements are included. Non-navigable anchors (no `href`) are excluded.

### `StructuredData`

Schema.org structured data extracted from the page, kept in three buckets corresponding to the three formats commonly used in real-world HTML:

```ts
interface StructuredData {
  jsonLd: StructuredDataItem[];     // <script type="application/ld+json">
  microdata: StructuredDataItem[];  // [itemscope] / itemtype / itemprop
  rdfa: StructuredDataItem[];       // vocab / typeof / property
}

interface StructuredDataItem {
  "@context"?: string | string[] | Record<string, unknown>;
  "@type"?: string | string[];
  "@id"?: string;
  "@parseError"?: string;
  [property: string]: /* nested item, primitive, or array thereof */ ...;
}
```

Microdata and RDFa items are normalised to the same JSON-LD-shaped object so consumers can use a single iteration pattern across formats. **Strings are preserved verbatim**: an `itemtype="http://schema.org/Person"` lands in the result exactly as written — no `http`→`https` rewriting, no prefix stripping. The validator (below) handles Schema.org normalisation centrally.

Failures are observable, not thrown:

- An invalid `<script type="application/ld+json">` body produces an item with `@parseError` set instead of a parsed object — the rest of the page still parses.
- A microdata `itemref` cycle inserts an `@parseError` item on the offending nested reference.

#### RDFa coverage

The RDFa extractor implements RDFa Lite plus the small set of RDFa 1.1 features that appear in real Schema.org RDFa: `vocab`, `typeof`, `property`, `resource`, `content`, `href`/`src` resolution, descendant subject inheritance, `prefix` declarations, and `rel` treated as a URI-bearing property when carrying an `href`. **Out of scope (documented limitations):** `rev`, full chaining, datatype literals, multi-pass URI/CURIE reasoning. Schema.org's own RDFa examples all fit within this subset.

#### Helpers

```ts
import { flattenStructuredData, flattenGraph } from "seotest";

const all = flattenStructuredData(data.structuredData);
// Array<StructuredDataItem & { _source: "jsonLd" | "microdata" | "rdfa" }>

const inlined = flattenGraph(data.structuredData.jsonLd);
// Inlines @graph entries; passes other items through unchanged.
```

## Validation (optional)

A lightweight validator built against Schema.org release 30.0 is available at the `seotest/validate` sub-path. It is opt-in and only loaded when imported, so the base bundle stays free of vocabulary data:

```ts
import { analyze } from "seotest";
import { validate } from "seotest/validate";

const data = analyze(html);
const result = validate(data.structuredData);

if (!result.valid) {
  for (const issue of result.issues) {
    console.warn(`[${issue.level}] ${issue.code}: ${issue.message}`, issue.path);
  }
}
```

`validate()` accepts a `StructuredData` buckets object, a `StructuredDataItem[]`, or a single `StructuredDataItem`. It returns:

```ts
interface ValidationResult {
  valid: boolean; // false when any issue has level "error"
  issues: ValidationIssue[];
}

interface ValidationIssue {
  level: "error" | "warning" | "info";
  code:
    | "unknown-vocabulary"
    | "unknown-type"
    | "unknown-property"
    | "property-not-in-domain"
    | "range-mismatch";
  path: (string | number)[]; // e.g. ["jsonLd", 0, "author", "@type"]
  type?: string;
  property?: string;
  message: string;
}
```

Pass `{ strict: true }` to promote warnings to errors (info-level issues such as `unknown-vocabulary` are not promoted).

#### Namespace handling

**Both `http://schema.org` and `https://schema.org` validate identically.** The validator normalises at lookup time, stripping the prefix from absolute URIs and accepting bare names that exist in the vocabulary. Items are detected as Schema.org via any of:

1. `@context` is `"http://schema.org"` or `"https://schema.org"` (with optional trailing `/`)
2. `@context` is an array containing one of those
3. `@context` is an object whose `@vocab` is one of those
4. `@context` is missing but `@type` is an absolute Schema.org URL (microdata/RDFa output)
5. `@context` is missing and `@type` is a bare name that exists in the vocabulary

If none of these hold, a single `info`-level `unknown-vocabulary` issue is emitted and type/property checks are skipped for that item.

#### Vocabulary version

The bundled vocabulary is generated from a Schema.org release. Read the active version:

```ts
import { VOCAB_VERSION } from "seotest/validate";
console.log(VOCAB_VERSION); // "30.0"
```

To regenerate against a different release, point `scripts/build-vocab.mjs` at it:

```sh
SCHEMAORG_RELEASE_DIR=/path/to/schemaorg/data/releases/31.0 \
SCHEMAORG_VERSIONS_JSON=/path/to/schemaorg/versions.json \
npm run build:vocab
```

The generator reads `schemaorg-all-https-types.csv` and `schemaorg-all-https-properties.csv`, strips the `https://schema.org/` prefix, and writes `src/validate/vocab.generated.ts`. Commit the regenerated file.

## Scripts

```sh
npm run build          # compile to dist/
npm run build:vocab    # regenerate Schema.org vocabulary from CSVs
npm run typecheck      # tsc --noEmit
npm test               # vitest run
npm run test:coverage  # vitest run --coverage
```
