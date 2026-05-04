import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchHtml, FetchError } from "../src/index.js";

const URL_TARGET = "https://example.com/";
const SAMPLE_HTML = `<!DOCTYPE html><html lang="en"><head>
  <title>Hello</title>
  <meta name="description" content="A test page">
</head><body><h1>Hi</h1></body></html>`;

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(...responses: Array<Response | Error>): void {
  let i = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async () => {
      const r = responses[i++];
      if (r instanceof Error) throw r;
      return r;
    }),
  );
}

describe("fetchHtml – success", () => {
  it("returns parsed SEO data and meta on 2xx", async () => {
    stubFetch(
      new Response(SAMPLE_HTML, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
    );
    const result = await fetchHtml(URL_TARGET);
    expect(result.title).toBe("Hello");
    expect(result.metaTags.description).toBe("A test page");
    expect(result.meta).toEqual({
      url: URL_TARGET,
      finalUrl: URL_TARGET,
      httpStatus: 200,
      contentType: "text/html; charset=utf-8",
      redirects: 0,
    });
  });
});

describe("fetchHtml – HTTP errors", () => {
  it("throws FetchError on 404", async () => {
    stubFetch(new Response("nope", { status: 404 }));
    const err = await fetchHtml(URL_TARGET).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(FetchError);
    expect((err as FetchError).status).toBe(404);
  });

  it("throws FetchError on 500", async () => {
    stubFetch(new Response("oops", { status: 500 }));
    const err = await fetchHtml(URL_TARGET).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(FetchError);
    expect((err as FetchError).status).toBe(500);
  });

  it("throws FetchError on network failure with status null", async () => {
    stubFetch(new TypeError("network down"));
    const err = await fetchHtml(URL_TARGET).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(FetchError);
    expect((err as FetchError).status).toBeNull();
  });
});

describe("fetchHtml – redirects", () => {
  it("follows redirects and counts them in meta", async () => {
    stubFetch(
      new Response(null, { status: 301, headers: { Location: "https://example.com/r1" } }),
      new Response(null, { status: 301, headers: { Location: "https://example.com/r2" } }),
      new Response(SAMPLE_HTML, { status: 200, headers: { "Content-Type": "text/html" } }),
    );
    const result = await fetchHtml(URL_TARGET);
    expect(result.meta.redirects).toBe(2);
    expect(result.meta.finalUrl).toBe("https://example.com/r2");
  });

  it("throws FetchError when redirect cap is exceeded", async () => {
    const redirect = new Response(null, {
      status: 301,
      headers: { Location: "https://example.com/loop" },
    });
    stubFetch(redirect, redirect, redirect);
    const err = await fetchHtml(URL_TARGET, { maxRedirects: 1 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(FetchError);
  });

  it("maxRedirects: 0 disables redirect following", async () => {
    stubFetch(new Response(null, { status: 301, headers: { Location: "https://example.com/x" } }));
    const err = await fetchHtml(URL_TARGET, { maxRedirects: 0 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(FetchError);
  });
});

describe("fetchHtml – options", () => {
  it("uses default User-Agent", async () => {
    stubFetch(new Response(SAMPLE_HTML, { status: 200 }));
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    await fetchHtml(URL_TARGET);
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string> | undefined;
    expect(headers?.["User-Agent"]).toBe("html-seo-parser/3.0");
  });

  it("uses custom User-Agent", async () => {
    stubFetch(new Response(SAMPLE_HTML, { status: 200 }));
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    await fetchHtml(URL_TARGET, { userAgent: "mybot/1" });
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string> | undefined;
    expect(headers?.["User-Agent"]).toBe("mybot/1");
  });

  it("throws FetchError when body exceeds maxSizeBytes", async () => {
    stubFetch(new Response("x".repeat(1000), { status: 200 }));
    const err = await fetchHtml(URL_TARGET, { maxSizeBytes: 100 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(FetchError);
  });

  it("handles 2xx response with null body", async () => {
    stubFetch(new Response(null, { status: 200 }));
    const result = await fetchHtml(URL_TARGET);
    expect(result.meta.httpStatus).toBe(200);
  });
});

describe("fetchHtml – redirect error paths", () => {
  it("throws FetchError when a redirect response is missing its Location header", async () => {
    stubFetch(new Response(null, { status: 301 }));
    const err = await fetchHtml(URL_TARGET).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(FetchError);
  });

  it("throws FetchError when a redirect has an unparseable Location URL", async () => {
    stubFetch(new Response(null, { status: 301, headers: { Location: "http://[bad" } }));
    const err = await fetchHtml(URL_TARGET).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(FetchError);
  });
});
