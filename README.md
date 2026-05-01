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

| Field         | Type                                  | Source                                                 |
| ------------- | ------------------------------------- | ------------------------------------------------------ |
| `title`       | `string \| null`                      | `<title>`                                              |
| `meta`        | [`MetaData`](#metadata)               | `<meta name="...">` and `<meta http-equiv="...">`      |
| `openGraph`   | [`OpenGraphData`](#opengraphdata)     | `<meta property="og:*">`                               |
| `twitterCard` | [`TwitterCardData`](#twittercarddata) | `<meta name="twitter:*">`                              |
| `canonical`   | `string \| null`                      | `<link rel="canonical">`                               |
| `hreflang`    | [`HreflangEntry[]`](#hreflangentry)   | `<link rel="alternate" hreflang="...">`                |
| `headings`    | [`HeadingEntry[]`](#headingentry)     | `<h1>` – `<h6>`                                        |
| `images`      | [`ImageEntry[]`](#imageentry)         | `<img>`                                                |
| `links`       | [`LinkEntry[]`](#linkentry)           | `<a href="...">`                                       |
| `language`    | `string \| null`                      | `<html lang="...">`                                    |
| `charset`     | `string \| null`                      | `<meta charset>` or `<meta http-equiv="content-type">` |
| `favicon`     | `string \| null`                      | `<link rel="icon">` / `rel="shortcut icon"`            |

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

## Scripts

```sh
npm run build          # compile to dist/
npm run typecheck      # tsc --noEmit
npm test               # vitest run
npm run test:coverage  # vitest run --coverage
```
