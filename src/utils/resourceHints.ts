import type { ResourceHintOptions } from "../types/resourceHints";
import type { LinkTag } from "../types/tags";

export const buildResourceHintLink = (options: ResourceHintOptions): LinkTag => {
  const link: LinkTag = {
    rel: options.rel,
    href: options.href,
  };

  if (options.as) {
    link.as = options.as;
  }
  if (options.type) {
    link.type = options.type;
  }
  if (options.crossOrigin !== undefined) {
    link.crossOrigin = options.crossOrigin;
  }
  if (options.integrity) {
    link.integrity = options.integrity;
  }
  if (options.fetchPriority) {
    link.fetchPriority = options.fetchPriority;
  }
  if (options.imageSrcSet) {
    link.imageSrcSet = options.imageSrcSet;
  }
  if (options.imageSizes) {
    link.imageSizes = options.imageSizes;
  }
  if (options.media) {
    link.media = options.media;
  }
  if (options.nonce) {
    link.nonce = options.nonce;
  }
  if (options.referrerPolicy) {
    link.referrerPolicy = options.referrerPolicy;
  }

  return link;
};
