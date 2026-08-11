import type { HelmetData } from "../core/HelmetData";
import type { RemixLinkDescriptor } from "../types/adapters";
import type { HelmetState, HelmetTagCollection } from "../types/tags";
import { extractXRobotsTagHeader } from "../utils/robotsBuilder";

export type { RemixLinkDescriptor };

export const toRemixMeta = (
  input?: HelmetData | HelmetState | HelmetTagCollection | Record<string, any>,
): Array<Record<string, any>> => {
  if (!input) {
    return [];
  }

  let state: any = input;
  if (typeof state === "object" && state !== null && "getState" in state && typeof state.getState === "function") {
    state = state.getState();
  }

  const metaList: Array<Record<string, any>> = [];

  if (state.title) {
    metaList.push({ title: state.title });
  }

  if (Array.isArray(state.meta)) {
    for (const tag of state.meta) {
      if (!tag) continue;
      if (tag.charSet) {
        metaList.push({ charSet: tag.charSet });
      } else if (tag.name) {
        metaList.push({ name: tag.name, content: tag.content ?? "" });
      } else if (tag.property) {
        metaList.push({ property: tag.property, content: tag.content ?? "" });
      } else if (tag.httpEquiv) {
        metaList.push({ httpEquiv: tag.httpEquiv, content: tag.content ?? "" });
      } else {
        metaList.push({ ...tag });
      }
    }
  }

  if (Array.isArray(state.script)) {
    for (const tag of state.script) {
      if (!tag) continue;
      if (tag.type === "application/ld+json" && tag.innerHTML) {
        try {
          const parsed = typeof tag.innerHTML === "string" ? JSON.parse(tag.innerHTML) : tag.innerHTML;
          metaList.push({ "script:ld+json": parsed });
        } catch {
          metaList.push({ name: "json-ld", content: tag.innerHTML });
        }
      }
    }
  }

  return metaList;
};

export const toRemixLinks = (
  input?: HelmetData | HelmetState | HelmetTagCollection | Record<string, any> | any[],
): RemixLinkDescriptor[] => {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.map((item) => ({
      rel: item.rel ?? "stylesheet",
      href: item.href ?? "",
      ...item,
    }));
  }

  let state: any = input;
  if (typeof state === "object" && state !== null && "getState" in state && typeof state.getState === "function") {
    state = state.getState();
  }

  const links: RemixLinkDescriptor[] = [];
  if (Array.isArray(state.link)) {
    for (const tag of state.link) {
      if (!tag || !tag.rel || !tag.href) continue;
      links.push({
        rel: tag.rel,
        href: tag.href,
        as: tag.as,
        crossOrigin: tag.crossOrigin,
        imageSizes: tag.imageSizes,
        imageSrcSet: tag.imageSrcSet,
        integrity: tag.integrity,
        media: tag.media,
        referrerPolicy: tag.referrerPolicy,
        sizes: tag.sizes,
        type: tag.type,
        ...tag,
      });
    }
  }

  return links;
};

export const toRemixHeaders = (
  input?: HelmetData | HelmetState | Record<string, any>,
  baseHeaders?: Record<string, string>,
): Record<string, string> => {
  const headers: Record<string, string> = { ...(baseHeaders ?? {}) };

  if (input) {
    const robotsHeader = extractXRobotsTagHeader(input);
    if (robotsHeader["X-Robots-Tag"]) {
      headers["X-Robots-Tag"] = robotsHeader["X-Robots-Tag"];
    }

    let state: any = input;
    if (typeof state === "object" && state !== null && "getState" in state && typeof state.getState === "function") {
      state = state.getState();
    }

    if (Array.isArray(state.meta)) {
      for (const tag of state.meta) {
        if (tag && tag.httpEquiv && tag.content) {
          const key = String(tag.httpEquiv);
          headers[key] = String(tag.content);
        }
      }
    }
  }

  return headers;
};
