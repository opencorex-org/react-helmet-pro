import { parseHtmlToHelmetState } from "../cli/htmlParser";
import type { HelmetState } from "../types/tags";

// Helper to check if value is a DOM Node
const isDomNode = (val: any): val is Node => {
  return !!(val && typeof val === "object" && typeof val.nodeType === "number");
};

// Helper to check if value is a HelmetState object
const isHelmetState = (received: any): boolean => {
  if (!received || typeof received !== "object") return false;
  if (isDomNode(received)) return false;

  return (
    ("meta" in received && Array.isArray(received.meta)) ||
    ("link" in received && Array.isArray(received.link)) ||
    ("script" in received && Array.isArray(received.script)) ||
    ("style" in received && Array.isArray(received.style)) ||
    ("noscript" in received && Array.isArray(received.noscript)) ||
    ("title" in received && (typeof received.title === "string" || received.title === undefined))
  );
};

// Main normalizer that extracts specific tag attributes or text
interface NormalizedTag {
  tag: string;
  attrs: Record<string, string>;
  text?: string;
}

const extractTagsFromDom = (node: Node): NormalizedTag[] => {
  const result: NormalizedTag[] = [];

  const isQueryable = node.nodeType === 9 || node.nodeType === 1 || node.nodeType === 11;
  if (!isQueryable) return [];

  const extractElement = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    if (!["title", "meta", "link", "script", "style", "noscript"].includes(tag)) {
      return;
    }
    const attrs: Record<string, string> = {};
    Array.from(el.attributes).forEach((attr) => {
      attrs[attr.name.toLowerCase()] = attr.value;
    });
    result.push({
      tag,
      attrs,
      text: el.textContent || "",
    });
  };

  if (node.nodeType === 1) {
    extractElement(node as Element);
  }

  const elements = (node as any).querySelectorAll("*");
  if (elements) {
    elements.forEach((el: Element) => {
      extractElement(el);
    });
  }

  return result;
};

const normalizeInput = (received: any): NormalizedTag[] => {
  if (typeof received === "string") {
    // 1. Raw HTML or SSR String
    const state = parseHtmlToHelmetState(received);
    return convertHelmetStateToTags(state);
  }
  
  if (isDomNode(received)) {
    // 2. DOM Node
    return extractTagsFromDom(received);
  }

  if (isHelmetState(received)) {
    // 3. HelmetState
    return convertHelmetStateToTags(received as HelmetState);
  }

  return [];
};

const convertHelmetStateToTags = (state: HelmetState): NormalizedTag[] => {
  const result: NormalizedTag[] = [];

  if (state.title) {
    result.push({
      tag: "title",
      attrs: {},
      text: state.title,
    });
  }

  if (state.meta) {
    state.meta.forEach((m) => {
      const attrs: Record<string, string> = {};
      if (m.name) attrs.name = String(m.name);
      if (m.property) attrs.property = String(m.property);
      if (m.content) attrs.content = String(m.content);
      if (m.charSet) attrs.charset = String(m.charSet);
      if (m.httpEquiv) attrs["http-equiv"] = String(m.httpEquiv);
      result.push({ tag: "meta", attrs });
    });
  }

  if (state.link) {
    state.link.forEach((l) => {
      const attrs: Record<string, string> = {};
      if (l.rel) attrs.rel = String(l.rel);
      if (l.href) attrs.href = String(l.href);
      if (l.hrefLang) attrs.hreflang = String(l.hrefLang);
      if (l.as) attrs.as = String(l.as);
      if (l.sizes) attrs.sizes = String(l.sizes);
      if (l.type) attrs.type = String(l.type);
      if (l.media) attrs.media = String(l.media);
      result.push({ tag: "link", attrs });
    });
  }

  if (state.script) {
    state.script.forEach((s) => {
      const attrs: Record<string, string> = {};
      if (s.type) attrs.type = String(s.type);
      if (s.src) attrs.src = String(s.src);
      result.push({
        tag: "script",
        attrs,
        text: s.innerHTML || "",
      });
    });
  }

  return result;
};

// Helper for deep partial matching
const isPartialMatch = (obj: any, partial: any): boolean => {
  if (obj === partial) return true;
  if (typeof obj !== "object" || obj === null || typeof partial !== "object" || partial === null) {
    return obj === partial;
  }
  return Object.keys(partial).every((key) => {
    return isPartialMatch(obj[key], partial[key]);
  });
};

// Custom Matchers implementation
export function toHaveCanonical(this: any, received: any, expectedHref: string) {
  const tags = normalizeInput(received);
  const canonicalTag = tags.find((t) => t.tag === "link" && t.attrs.rel === "canonical");

  const pass = canonicalTag !== undefined && canonicalTag.attrs.href === expectedHref;


  const message = pass
    ? () =>
        `Expected canonical link not to be "${expectedHref}"`
    : () => {
        if (!canonicalTag) {
          return `Expected canonical link to be "${expectedHref}", but no canonical link tag was found.`;
        }
        return `Expected canonical link to be "${expectedHref}", but found "${canonicalTag.attrs.href}".`;
      };

  return { pass, message };
}

export function toBeIndexable(this: any, received: any) {
  const tags = normalizeInput(received);
  
  // Look for robots/googlebot tags containing "noindex"
  const noindexTags = tags.filter((t) => {
    if (t.tag !== "meta") return false;
    const name = (t.attrs.name || "").toLowerCase();
    const content = (t.attrs.content || "").toLowerCase();
    return (name === "robots" || name === "googlebot") && content.includes("noindex");
  });

  const pass = noindexTags.length === 0;

  const message = pass
    ? () =>
        `Expected SEO state not to be indexable, but no "noindex" meta tag was found.`
    : () =>
        `Expected SEO state to be indexable, but found "noindex" in meta tag: name="${noindexTags[0].attrs.name}" content="${noindexTags[0].attrs.content}".`;

  return { pass, message };
}

export function toHaveValidStructuredData(
  this: any,
  received: any,
  expectedType?: string,
  expectedSchema?: any
) {
  const tags = normalizeInput(received);
  const jsonLdScripts = tags.filter((t) => t.tag === "script" && t.attrs.type === "application/ld+json");

  if (jsonLdScripts.length === 0) {
    return {
      pass: false,
      message: () => "Expected structured data (application/ld+json) script to be found, but none was present.",
    };
  }

  const parsedSchemas: any[] = [];
  const errors: string[] = [];

  for (const script of jsonLdScripts) {
    try {
      const parsed = JSON.parse(script.text || "");
      parsedSchemas.push(parsed);
    } catch (err: any) {
      errors.push(err.message);
    }
  }

  if (errors.length > 0) {
    return {
      pass: false,
      message: () => `Failed to parse structured data JSON-LD. Parse error: ${errors.join(", ")}`,
    };
  }

  // Helper to find type in graph or simple object
  const findSchemaByType = (schema: any, type: string): any => {
    if (!schema) return null;
    if (schema["@type"] === type) return schema;
    if (schema["@graph"] && Array.isArray(schema["@graph"])) {
      const match = schema["@graph"].find((s: any) => s["@type"] === type);
      if (match) return match;
    }
    if (Array.isArray(schema)) {
      const match = schema.find((s: any) => s["@type"] === type);
      if (match) return match;
    }
    return null;
  };

  if (expectedType) {
    let matchedSchema: any = null;
    for (const schema of parsedSchemas) {
      matchedSchema = findSchemaByType(schema, expectedType);
      if (matchedSchema) break;
    }

    if (!matchedSchema) {
      return {
        pass: false,
        message: () =>
          `Expected structured data of type "${expectedType}" to be present, but found: ${JSON.stringify(
            parsedSchemas
          )}`,
      };
    }

    if (expectedSchema) {
      const isMatch = isPartialMatch(matchedSchema, expectedSchema);
      return {
        pass: isMatch,
        message: () =>
          isMatch
            ? `Expected structured data not to partially match ${JSON.stringify(expectedSchema)}`
            : `Expected structured data of type "${expectedType}" to partially match ${JSON.stringify(
                expectedSchema
              )}, but it did not. Found: ${JSON.stringify(matchedSchema)}`,
      };
    }

    return {
      pass: true,
      message: () => `Expected structured data of type "${expectedType}" not to be present.`,
    };
  }

  return {
    pass: true,
    message: () => "Expected structured data not to be valid, but parsed successfully.",
  };
}

export function toHaveHreflang(
  this: any,
  received: any,
  expectedLanguage: string,
  expectedHref?: string
) {
  const tags = normalizeInput(received);
  const alternateTags = tags.filter(
    (t) => t.tag === "link" && t.attrs.rel === "alternate" && t.attrs.hreflang === expectedLanguage
  );

  if (alternateTags.length === 0) {
    return {
      pass: false,
      message: () =>
        `Expected alternate hreflang link for language "${expectedLanguage}" to be present, but none was found.`,
    };
  }

  if (expectedHref) {
    const match = alternateTags.find((t) => t.attrs.href === expectedHref);
    const pass = match !== undefined;
    const message = pass
      ? () => `Expected alternate hreflang link for language "${expectedLanguage}" not to point to "${expectedHref}".`
      : () =>
          `Expected alternate hreflang link for language "${expectedLanguage}" to point to "${expectedHref}", but found: ${alternateTags
            .map((t) => `"${t.attrs.href}"`)
            .join(", ")}`;

    return { pass, message };
  }

  return {
    pass: true,
    message: () => `Expected alternate hreflang link for language "${expectedLanguage}" not to be present.`,
  };
}
