import type { SeoRobotsDirectives } from "./robots";

export type ReactRouterMetaDescriptor =
  | { title?: string }
  | { name?: string; content?: string }
  | { property?: string; content?: string }
  | { httpEquiv?: string; content?: string }
  | { charSet?: string }
  | Record<string, unknown>;

export interface RemixLinkDescriptor {
  rel: string;
  href: string;
  as?: string;
  crossOrigin?: string;
  imageSizes?: string;
  imageSrcSet?: string;
  integrity?: string;
  media?: string;
  referrerPolicy?: string;
  sizes?: string;
  type?: string;
  [key: string]: unknown;
}

export interface AstroHeadCollection {
  bodyAttributes: Record<string, string>;
  htmlAttributes: Record<string, string>;
  link: Array<Record<string, string>>;
  meta: Array<Record<string, string>>;
  noscript: Array<Record<string, string>>;
  script: Array<Record<string, string>>;
  style: Array<Record<string, string>>;
  title?: string;
  titleAttributes: Record<string, string>;
}

export interface ViteSsrInjectionOptions {
  bodyAttributesPlaceholder?: string;
  headPlaceholder?: string;
  htmlAttributesPlaceholder?: string;
  nonce?: string;
  prioritizeSeoTags?: boolean;
}

export interface ViteSsrStreamOptions {
  flushMarker?: string;
  headPlaceholder?: string;
  prioritizeSeoTags?: boolean;
}

export interface ServerHelmetMiddlewareOptions {
  autoXRobotsTag?: boolean;
  robotsDirectives?: SeoRobotsDirectives;
}
