import { analyze } from "./analyze.js";
import type { FetchMeta, FetchOptions, FetchResult } from "./types.js";

const DEFAULT_USER_AGENT = "html-seo-parser/3.0";
const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPT = "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1";

export class FetchError extends Error {
  readonly url: string;
  readonly status: number | null;

  constructor(message: string, url: string, status: number | null = null, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "FetchError";
    this.url = url;
    this.status = status;
  }
}

interface ResolvedOptions {
  userAgent: string;
  maxRedirects: number;
  timeoutMs: number;
  maxSizeBytes: number;
}

function resolveOptions(options: FetchOptions): ResolvedOptions {
  return {
    userAgent: options.userAgent ?? DEFAULT_USER_AGENT,
    maxRedirects: options.maxRedirects ?? DEFAULT_MAX_REDIRECTS,
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxSizeBytes: options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES,
  };
}

async function readBodyUpToLimit(
  response: Response,
  url: string,
  status: number,
  maxBytes: number,
): Promise<string> {
  const { body } = response;
  if (body === null) return "";

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        throw new FetchError(
          `Response body exceeds maxSizeBytes (${maxBytes}) at ${url}`,
          url,
          status,
        );
      }
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }

  const combined = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    combined.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false, ignoreBOM: true }).decode(combined);
}

interface FetchedBody {
  body: string;
  finalUrl: string;
  httpStatus: number;
  contentType: string | null;
  redirects: number;
}

async function fetchWithRedirects(initialUrl: string, opts: ResolvedOptions): Promise<FetchedBody> {
  let currentUrl = initialUrl;
  let redirects = 0;

  while (true) {
    let response: Response;
    try {
      response = await fetch(currentUrl, {
        redirect: "manual",
        headers: { Accept: ACCEPT, "User-Agent": opts.userAgent },
        signal: AbortSignal.timeout(opts.timeoutMs),
      });
    } catch (cause) {
      throw new FetchError(
        `Failed to fetch ${currentUrl}: ${(cause as Error).message}`,
        currentUrl,
        null,
        cause,
      );
    }

    const { status } = response;
    if (status >= 300 && status < 400) {
      if (redirects >= opts.maxRedirects) {
        throw new FetchError(
          `Too many redirects (>${opts.maxRedirects}) fetching ${initialUrl}`,
          currentUrl,
          status,
        );
      }
      const location = response.headers.get("Location");
      if (location === null) {
        throw new FetchError(
          `Redirect from ${currentUrl} missing Location header`,
          currentUrl,
          status,
        );
      }
      try {
        currentUrl = new URL(location, currentUrl).href;
      } catch {
        throw new FetchError(
          `Redirect from ${currentUrl} has invalid Location: ${location}`,
          currentUrl,
          status,
        );
      }
      redirects++;
      continue;
    }

    if (!response.ok) {
      throw new FetchError(`HTTP ${status} fetching ${currentUrl}`, currentUrl, status);
    }

    const contentType = response.headers.get("content-type");
    const body = await readBodyUpToLimit(response, currentUrl, status, opts.maxSizeBytes);
    return {
      body,
      finalUrl: currentUrl,
      httpStatus: status,
      contentType,
      redirects,
    };
  }
}

export async function fetchHtml(url: string, options: FetchOptions = {}): Promise<FetchResult> {
  const opts = resolveOptions(options);
  const fetched = await fetchWithRedirects(url, opts);
  const seo = analyze(fetched.body);
  const meta: FetchMeta = {
    url,
    finalUrl: fetched.finalUrl,
    httpStatus: fetched.httpStatus,
    contentType: fetched.contentType,
    redirects: fetched.redirects,
  };
  return { ...seo, meta };
}
