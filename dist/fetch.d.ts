import type { FetchOptions, FetchResult } from "./types.js";
export declare class FetchError extends Error {
  readonly url: string;
  readonly status: number | null;
  constructor(message: string, url: string, status?: number | null, cause?: unknown);
}
export declare function fetchHtml(url: string, options?: FetchOptions): Promise<FetchResult>;
