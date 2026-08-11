import type { HelmetState } from "../types/tags";

const parseAttrs = (attrsStr: string): Record<string, string> => {
  const result: Record<string, string> = {};
  const attrRegex = /([a-z0-9_:@.-]+)(?:=["']([^"']*)["'])?/gi;
  let m: RegExpExecArray | null;
  while ((m = attrRegex.exec(attrsStr)) !== null) {
    if (m[1]) result[m[1].toLowerCase()] = m[2] ?? "true";
  }
  return result;
};

/**
 * Parses an HTML string into a `HelmetState` representation suitable
 * for passing to `auditHelmetState()`.
 *
 * This is used by the CLI audit runner to analyse static HTML files
 * and remote URL responses without a React render cycle.
 */
export const parseHtmlToHelmetState = (htmlString: string): HelmetState => {
  const meta: HelmetState["meta"] = [];
  const link: HelmetState["link"] = [];
  const script: HelmetState["script"] = [];
  let title: string | undefined;

  // Extract <title>
  const titleMatch = htmlString.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // Extract <html> attributes
  const htmlAttributes: Record<string, string | number | boolean | null | undefined> = {};
  const htmlTagMatch = htmlString.match(/<html([^>]*)>/i);
  if (htmlTagMatch?.[1]) {
    Object.assign(htmlAttributes, parseAttrs(htmlTagMatch[1]));
  }

  // Extract <body> attributes
  const bodyAttributes: Record<string, string | number | boolean | null | undefined> = {};
  const bodyTagMatch = htmlString.match(/<body([^>]*)>/i);
  if (bodyTagMatch?.[1]) {
    Object.assign(bodyAttributes, parseAttrs(bodyTagMatch[1]));
  }

  // Extract <meta> tags
  const metaRegex = /<meta([^>]*)\/?>/gi;
  let metaMatch: RegExpExecArray | null;
  while ((metaMatch = metaRegex.exec(htmlString)) !== null) {
    const attrs = parseAttrs(metaMatch[1]);
    const tag: HelmetState["meta"][number] = {};
    if (attrs.name) tag.name = attrs.name;
    if (attrs.property) tag.property = attrs.property;
    if (attrs.content) tag.content = attrs.content;
    if (attrs.charset || attrs["charset"]) tag.charSet = attrs.charset ?? attrs["charset"];
    if (attrs["http-equiv"]) tag.httpEquiv = attrs["http-equiv"];
    meta.push(tag);
  }

  // Extract <link> tags (skip <link> as "a" elements in body)
  const linkRegex = /<link([^>]*)\/?>/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(htmlString)) !== null) {
    const attrs = parseAttrs(linkMatch[1]);
    const tag: HelmetState["link"][number] = {};
    if (attrs.rel) tag.rel = attrs.rel;
    if (attrs.href) tag.href = attrs.href;
    if (attrs.hreflang) tag.hrefLang = attrs.hreflang;
    if (attrs.as) tag.as = attrs.as;
    if (attrs.sizes) tag.sizes = attrs.sizes;
    if (attrs.type) tag.type = attrs.type;
    if (attrs.media) tag.media = attrs.media;
    if (attrs.integrity) {
      tag.integrity = attrs.integrity as HelmetState["link"][number]["integrity"];
    }
    if (attrs.crossorigin) {
      tag.crossOrigin = attrs.crossorigin as HelmetState["link"][number]["crossOrigin"];
    }
    if (attrs.referrerpolicy) {
      tag.referrerPolicy = attrs.referrerpolicy as HelmetState["link"][number]["referrerPolicy"];
    }
    link.push(tag);
  }

  // Extract <script> tags
  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let scriptMatch: RegExpExecArray | null;
  while ((scriptMatch = scriptRegex.exec(htmlString)) !== null) {
    const attrs = parseAttrs(scriptMatch[1]);
    const innerHTML = scriptMatch[2].trim();
    const tag: HelmetState["script"][number] = { innerHTML };
    if (attrs.type) tag.type = attrs.type;
    if (attrs.src) tag.src = attrs.src;
    if (attrs.integrity) {
      tag.integrity = attrs.integrity as HelmetState["script"][number]["integrity"];
    }
    if (attrs.crossorigin) {
      tag.crossOrigin = attrs.crossorigin as HelmetState["script"][number]["crossOrigin"];
    }
    if (attrs.referrerpolicy) {
      tag.referrerPolicy = attrs.referrerpolicy as HelmetState["script"][number]["referrerPolicy"];
    }
    script.push(tag);
  }

  return {
    base: [],
    bodyAttributes,
    bodyCloseScripts: [],
    bodyOpenScripts: [],
    defer: false,
    encodeSpecialCharacters: true,
    htmlAttributes,
    link,
    meta,
    noscript: [],
    prioritizeSeoTags: false,
    script,
    style: [],
    title,
    titleAttributes: {},
  };
};
