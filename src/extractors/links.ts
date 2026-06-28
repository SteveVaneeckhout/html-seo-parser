import type { CheerioAPI } from "cheerio";
import type { LinkEntry, LinkKind } from "../types.js";

const SCHEME_RE = /^([a-z][a-z0-9+.-]*):/i;
const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
const TLD_DENYLIST = new Set([
  "html",
  "htm",
  "php",
  "asp",
  "aspx",
  "js",
  "mjs",
  "css",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "avif",
  "ico",
  "pdf",
  "json",
  "xml",
  "txt",
  "zip",
]);

function classifyKind(trimmed: string): LinkKind {
  const match = SCHEME_RE.exec(trimmed);
  if (match) {
    const scheme = match[1]!.toLowerCase();
    switch (scheme) {
      case "http":
      case "https":
        return "http";
      case "mailto":
        return "email";
      case "tel":
        return "tel";
      case "ftp":
      case "ftps":
        return "ftp";
      default:
        return "other";
    }
  }
  if (trimmed.startsWith("#")) return "anchor";
  return "http";
}

function resolve(trimmed: string, baseUrl: string | undefined): string | null {
  try {
    return new URL(trimmed, baseUrl ?? undefined).href;
  } catch {
    return null;
  }
}

function computeIsExternal(
  kind: LinkKind,
  resolvedUrl: string | null,
  docHost: string | null,
): boolean | null {
  // resolvedUrl is always a serialized URL, so re-parsing it never throws.
  if (kind !== "http" || docHost === null || resolvedUrl === null) return null;
  return new URL(resolvedUrl).host !== docHost;
}

function detectMissingProtocol(trimmed: string): boolean {
  if (
    trimmed.length === 0 ||
    SCHEME_RE.test(trimmed) ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("?")
  ) {
    return false;
  }
  const head = trimmed.split(/[/?#]/, 1)[0]!;
  if (/^www\./i.test(head)) return true;
  if (!DOMAIN_RE.test(head)) return false;
  const labels = head.split(".");
  const tld = labels[labels.length - 1]!.toLowerCase();
  return tld.length >= 2 && /^[a-z]+$/.test(tld) && !TLD_DENYLIST.has(tld);
}

// `resolveBase` is the effective base used to resolve relative hrefs (honors any in-page
// `<base href>`). `docUrl` is the document's own URL — links are "external" when they resolve
// to a different host than where the page actually lives, regardless of `<base href>`.
export function extractLinks($: CheerioAPI, resolveBase?: string, docUrl?: string): LinkEntry[] {
  let docHost: string | null = null;
  if (docUrl !== undefined) {
    try {
      docHost = new URL(docUrl).host;
    } catch {
      docHost = null; // invalid base URL — external status is unknowable
    }
  }

  const entries: LinkEntry[] = [];
  $("a[href]").each((_i, el) => {
    const $el = $(el);
    const href = $el.attr("href")!;
    const trimmed = href.trim();
    const kind = classifyKind(trimmed);
    const resolvedUrl = resolve(trimmed, resolveBase);
    entries.push({
      href,
      rel: $el.attr("rel") ?? null,
      text: $el.text().trim() || null,
      target: $el.attr("target") ?? null,
      kind,
      isExternal: computeIsExternal(kind, resolvedUrl, docHost),
      resolvedUrl,
      likelyMissingProtocol: detectMissingProtocol(trimmed),
    });
  });
  return entries;
}
