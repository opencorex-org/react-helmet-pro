import { parseHtmlToHelmetState } from "../cli/htmlParser";
import type { HelmetState } from "../types/tags";

// Helper to sort object attributes key-value pair alphabetically
const sortAttributes = (attrs: Record<string, any> = {}): Record<string, string> => {
  const sorted: Record<string, string> = {};
  Object.keys(attrs)
    .sort()
    .forEach((key) => {
      sorted[key] = String(attrs[key]);
    });
  return sorted;
};

// Formats a single tag
const formatTag = (tag: string, attrs: Record<string, any> = {}, text?: string): string => {
  const sortedAttrs = sortAttributes(attrs);
  const attrStr = Object.entries(sortedAttrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");

  const prefix = attrStr ? ` ${attrStr}` : "";

  if (tag === "title") {
    return `<title${prefix}>${text || ""}</title>`;
  }
  if (tag === "meta") {
    return `<meta${prefix} />`;
  }
  if (tag === "link") {
    return `<link${prefix} />`;
  }
  if (tag === "script") {
    // If structured data, format/prettify JSON-LD
    let content = text || "";
    if (attrs.type === "application/ld+json" && content) {
      try {
        content = JSON.stringify(JSON.parse(content), null, 2);
      } catch {
        // Fallback to raw string
      }
    }
    return `<script${prefix}>${content}</script>`;
  }
  if (tag === "style") {
    return `<style${prefix}>${text || ""}</style>`;
  }
  if (tag === "noscript") {
    return `<noscript${prefix}>${text || ""}</noscript>`;
  }
  return `<${tag}${prefix}>${text || ""}</${tag}>`;
};

// Main serializer implementation
export const helmetSnapshotSerializer = {
  test(val: any): boolean {
    if (!val) return false;
    // Test if it is a HelmetState object
    if (
      typeof val === "object" &&
      ("meta" in val || "link" in val || "title" in val || "htmlAttributes" in val)
    ) {
      return true;
    }
    // Test if it is a raw HTML/SSR head string (has any supported head tags)
    if (typeof val === "string" && /<\/?(title|meta|link|script|style|noscript)\b/i.test(val)) {
      return true;
    }
    return false;
  },

  serialize(
    val: any,
    config: any,
    indentation: string,
    depth: number,
    refs: any,
    printer: any
  ): string {
    let state: HelmetState;

    if (typeof val === "string") {
      state = parseHtmlToHelmetState(val);
    } else {
      state = val as HelmetState;
    }

    const lines: string[] = [];

    // Title
    if (state.title) {
      lines.push(formatTag("title", state.titleAttributes || {}, state.title));
    }

    // Base (sorted alphabetically by all attributes)
    const sortedBases = [...(state.base || [])].sort((a, b) => {
      const keyA = JSON.stringify(sortAttributes(a));
      const keyB = JSON.stringify(sortAttributes(b));
      return keyA.localeCompare(keyB);
    });
    sortedBases.forEach((b) => {
      lines.push(formatTag("base", b as any));
    });

    // HTML Attributes
    if (state.htmlAttributes && Object.keys(state.htmlAttributes).length > 0) {
      lines.push(`<!-- htmlAttributes: ${JSON.stringify(sortAttributes(state.htmlAttributes))} -->`);
    }

    // Body Attributes
    if (state.bodyAttributes && Object.keys(state.bodyAttributes).length > 0) {
      lines.push(`<!-- bodyAttributes: ${JSON.stringify(sortAttributes(state.bodyAttributes))} -->`);
    }

    // Meta tags: sorted alphabetically by all attributes
    const sortedMetas = [...(state.meta || [])].sort((a, b) => {
      const keyA = JSON.stringify(sortAttributes(a));
      const keyB = JSON.stringify(sortAttributes(b));
      return keyA.localeCompare(keyB);
    });
    sortedMetas.forEach((m) => {
      const attrs: Record<string, string> = {};
      if (m.name) attrs.name = String(m.name);
      if (m.property) attrs.property = String(m.property);
      if (m.content) attrs.content = String(m.content);
      if (m.charSet) attrs.charset = String(m.charSet);
      if (m.httpEquiv) attrs["http-equiv"] = String(m.httpEquiv);
      lines.push(formatTag("meta", attrs));
    });

    // Link tags: sorted alphabetically by all attributes
    const sortedLinks = [...(state.link || [])].sort((a, b) => {
      const keyA = JSON.stringify(sortAttributes(a));
      const keyB = JSON.stringify(sortAttributes(b));
      return keyA.localeCompare(keyB);
    });
    sortedLinks.forEach((l) => {
      const attrs: Record<string, string> = {};
      if (l.rel) attrs.rel = String(l.rel);
      if (l.href) attrs.href = String(l.href);
      if (l.hrefLang) attrs.hreflang = String(l.hrefLang);
      if (l.as) attrs.as = String(l.as);
      if (l.sizes) attrs.sizes = String(l.sizes);
      if (l.type) attrs.type = String(l.type);
      if (l.media) attrs.media = String(l.media);
      lines.push(formatTag("link", attrs));
    });

    // Script tags: sorted by all attributes + innerHTML content
    const sortedScripts = [...(state.script || [])].sort((a, b) => {
      const keyA = `${JSON.stringify(sortAttributes(a))}:${a.innerHTML || ""}`;
      const keyB = `${JSON.stringify(sortAttributes(b))}:${b.innerHTML || ""}`;
      return keyA.localeCompare(keyB);
    });
    sortedScripts.forEach((s) => {
      const attrs: Record<string, string> = {};
      if (s.type) attrs.type = String(s.type);
      if (s.src) attrs.src = String(s.src);
      lines.push(formatTag("script", attrs, s.innerHTML || ""));
    });

    // Style tags: sorted by all attributes + cssText content
    const sortedStyles = [...(state.style || [])].sort((a, b) => {
      const keyA = `${JSON.stringify(sortAttributes(a))}:${a.cssText || ""}`;
      const keyB = `${JSON.stringify(sortAttributes(b))}:${b.cssText || ""}`;
      return keyA.localeCompare(keyB);
    });
    sortedStyles.forEach((st) => {
      const attrs: Record<string, string> = {};
      if (st.media) attrs.media = String(st.media);
      lines.push(formatTag("style", attrs, st.cssText || ""));
    });

    // Noscript tags: sorted by innerHTML content
    const sortedNoscripts = [...(state.noscript || [])].sort((a, b) => {
      const keyA = a.innerHTML || "";
      const keyB = b.innerHTML || "";
      return keyA.localeCompare(keyB);
    });
    sortedNoscripts.forEach((ns) => {
      lines.push(formatTag("noscript", {}, ns.innerHTML || ""));
    });

    return lines.join("\n");
  },
};
