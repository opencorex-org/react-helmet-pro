export type ResourceHintRel =
  | "preload"
  | "modulepreload"
  | "preconnect"
  | "dns-prefetch"
  | "prefetch"
  | "prerender";

export interface ResourceHintOptions {
  as?: string;
  crossOrigin?: CrossOriginPolicy;
  fetchPriority?: "high" | "low" | "auto";
  href: string;
  imageSizes?: string;
  imageSrcSet?: string;
  integrity?: SubresourceIntegrity;
  media?: string;
  nonce?: string;
  referrerPolicy?: ReferrerPolicy;
  rel: ResourceHintRel;
  type?: string;
}

export interface PreloadProps extends Omit<ResourceHintOptions, "rel"> {
  as: "script" | "style" | "font" | "image" | "fetch" | "document" | "track" | "worker" | string;
}

export interface ModulePreloadProps extends Omit<ResourceHintOptions, "rel" | "as"> {
  as?: "script" | string;
}

export interface PreconnectProps extends Omit<ResourceHintOptions, "rel" | "as"> {}

export interface DnsPrefetchProps {
  href: string;
}

export interface PrefetchProps extends Omit<ResourceHintOptions, "rel"> {}
import type {
  CrossOriginPolicy,
  ReferrerPolicy,
  SubresourceIntegrity,
} from "./subresourceIntegrity";
