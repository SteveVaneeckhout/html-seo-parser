export interface HttpEquivData {
  contentType: string | null;
  refresh: string | null;
  xUaCompatible: string | null;
}
export interface MetaData {
  description: string | null;
  keywords: string | null;
  robots: string | null;
  author: string | null;
  viewport: string | null;
  rating: string | null;
  referrer: string | null;
  httpEquiv: HttpEquivData;
}
export interface OpenGraphData {
  title: string | null;
  description: string | null;
  image: string | null;
  imageWidth: string | null;
  imageHeight: string | null;
  imageAlt: string | null;
  url: string | null;
  type: string | null;
  siteName: string | null;
  locale: string | null;
  localeAlternate: string[];
}
export interface TwitterCardData {
  card: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  imageAlt: string | null;
  site: string | null;
  creator: string | null;
}
export interface HreflangEntry {
  hreflang: string;
  href: string;
}
export interface HeadingEntry {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  order: number;
}
export interface ImageEntry {
  src: string | null;
  alt: string | null;
  title: string | null;
  width: string | null;
  height: string | null;
  loading: string | null;
}
export interface LinkEntry {
  href: string;
  rel: string | null;
  text: string | null;
  target: string | null;
}
export interface SeoData {
  title: string | null;
  meta: MetaData;
  openGraph: OpenGraphData;
  twitterCard: TwitterCardData;
  canonical: string | null;
  hreflang: HreflangEntry[];
  headings: HeadingEntry[];
  images: ImageEntry[];
  links: LinkEntry[];
  language: string | null;
  charset: string | null;
  favicon: string | null;
}
//# sourceMappingURL=types.d.ts.map
