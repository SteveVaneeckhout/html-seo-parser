import { analyze } from "./analyze.js";
const DEFAULT_USER_AGENT = "html-seo-parser/3.0";
const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPT = "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1";
export class FetchError extends Error {
    url;
    status;
    constructor(message, url, status = null, cause) {
        super(message, cause === undefined ? undefined : { cause });
        this.name = "FetchError";
        this.url = url;
        this.status = status;
    }
}
function resolveOptions(options) {
    return {
        userAgent: options.userAgent ?? DEFAULT_USER_AGENT,
        maxRedirects: options.maxRedirects ?? DEFAULT_MAX_REDIRECTS,
        timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        maxSizeBytes: options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES,
    };
}
async function readBodyUpToLimit(response, url, status, maxBytes) {
    const { body } = response;
    if (body === null)
        return "";
    const reader = body.getReader();
    const chunks = [];
    let total = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            total += value.byteLength;
            if (total > maxBytes) {
                throw new FetchError(`Response body exceeds maxSizeBytes (${maxBytes}) at ${url}`, url, status);
            }
            chunks.push(value);
        }
    }
    finally {
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
async function fetchWithRedirects(initialUrl, opts) {
    let currentUrl = initialUrl;
    let redirects = 0;
    while (true) {
        let response;
        try {
            response = await fetch(currentUrl, {
                redirect: "manual",
                headers: { Accept: ACCEPT, "User-Agent": opts.userAgent },
                signal: AbortSignal.timeout(opts.timeoutMs),
            });
        }
        catch (cause) {
            throw new FetchError(`Failed to fetch ${currentUrl}: ${cause.message}`, currentUrl, null, cause);
        }
        const { status } = response;
        if (status >= 300 && status < 400) {
            if (redirects >= opts.maxRedirects) {
                throw new FetchError(`Too many redirects (>${opts.maxRedirects}) fetching ${initialUrl}`, currentUrl, status);
            }
            const location = response.headers.get("Location");
            if (location === null) {
                throw new FetchError(`Redirect from ${currentUrl} missing Location header`, currentUrl, status);
            }
            try {
                currentUrl = new URL(location, currentUrl).href;
            }
            catch {
                throw new FetchError(`Redirect from ${currentUrl} has invalid Location: ${location}`, currentUrl, status);
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
export async function fetchHtml(url, options = {}) {
    const opts = resolveOptions(options);
    const fetched = await fetchWithRedirects(url, opts);
    const seo = analyze(fetched.body);
    const meta = {
        url,
        finalUrl: fetched.finalUrl,
        httpStatus: fetched.httpStatus,
        contentType: fetched.contentType,
        redirects: fetched.redirects,
    };
    return { ...seo, meta };
}
