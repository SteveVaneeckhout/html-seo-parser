import { analyze } from "./analyze.js";
const DEFAULT_USER_AGENT = "html-seo-parser/4.0";
const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPT = "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1";
export class FetchError extends Error {
    url;
    status;
    name = "FetchError";
    constructor(message, url, status = null, cause) {
        super(message, cause === undefined ? undefined : { cause });
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
        signal: options.signal,
    };
}
function requestSignal(opts) {
    const timeout = AbortSignal.timeout(opts.timeoutMs);
    return opts.signal === undefined ? timeout : AbortSignal.any([timeout, opts.signal]);
}
async function readBodyUpToLimit(response, url, status, maxBytes) {
    const { body } = response;
    if (body === null)
        return "";
    // A default TextDecoder strips a leading UTF-8 BOM, as Response.text() does.
    const decoder = new TextDecoder();
    let text = "";
    let total = 0;
    // Throwing out of the loop cancels the stream.
    for await (const chunk of body) {
        total += chunk.byteLength;
        if (total > maxBytes) {
            throw new FetchError(`Response body exceeds maxSizeBytes (${maxBytes}) at ${url}`, url, status);
        }
        text += decoder.decode(chunk, { stream: true });
    }
    return text + decoder.decode();
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
                signal: requestSignal(opts),
            });
        }
        catch (cause) {
            // A caller-initiated abort is rethrown as the caller's own abort reason.
            opts.signal?.throwIfAborted();
            throw new FetchError(`Failed to fetch ${currentUrl}: ${Error.isError(cause) ? cause.message : String(cause)}`, currentUrl, null, cause);
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
            const nextUrl = URL.parse(location, currentUrl);
            if (nextUrl === null) {
                throw new FetchError(`Redirect from ${currentUrl} has invalid Location: ${location}`, currentUrl, status);
            }
            currentUrl = nextUrl.href;
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
    const seo = analyze(fetched.body, { baseUrl: fetched.finalUrl });
    const meta = {
        url,
        finalUrl: fetched.finalUrl,
        httpStatus: fetched.httpStatus,
        contentType: fetched.contentType,
        redirects: fetched.redirects,
    };
    return { ...seo, meta };
}
