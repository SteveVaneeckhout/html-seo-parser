import type { CheerioAPI } from "cheerio";
import type { LinkEntry, LinkKind } from "../types.js";
import { textContent } from "./dom.js";

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

function computeIsExternal(
  kind: LinkKind,
  resolved: URL | null,
  docHost: string | null,
): boolean | null {
  if (kind !== "http" || docHost === null || resolved === null) return null;
  return resolved.host !== docHost;
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
  const tld = labels.at(-1)!.toLowerCase();
  return tld.length >= 2 && /^[a-z]+$/.test(tld) && !TLD_DENYLIST.has(tld);
}

// `resolveBase` is the effective base used to resolve relative hrefs (honors any in-page
// `<base href>`). `docUrl` is the document's own URL — links are "external" when they resolve
// to a different host than where the page actually lives, regardless of `<base href>`.
export function extractLinks($: CheerioAPI, resolveBase?: string, docUrl?: string): LinkEntry[] {
  // An invalid document URL leaves external status unknowable (null).
  const docHost = docUrl === undefined ? null : (URL.parse(docUrl)?.host ?? null);

  const entries: LinkEntry[] = [];
  $("a[href]").each((_i, el) => {
    const $el = $(el);
    const href = $el.attr("href")!;
    const trimmed = href.trim();
    const kind = classifyKind(trimmed);
    const resolved = URL.parse(trimmed, resolveBase);
    entries.push({
      href,
      rel: $el.attr("rel") ?? null,
      text: textContent(el).trim() || null,
      target: $el.attr("target") ?? null,
      kind,
      isExternal: computeIsExternal(kind, resolved, docHost),
      resolvedUrl: resolved?.href ?? null,
      likelyMissingProtocol: detectMissingProtocol(trimmed),
    });
  });
  return entries;
}
