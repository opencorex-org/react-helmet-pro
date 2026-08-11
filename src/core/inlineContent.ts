export type ScriptContent = string & { readonly __scriptContent: unique symbol };
export type JsonLdContent = string & { readonly __jsonLdContent: unique symbol };
export type StyleContent = string & { readonly __styleContent: unique symbol };
export type NoscriptHtml = string & { readonly __noscriptHtml: unique symbol };

export type InlineContentKind = "script" | "json-ld" | "style" | "noscript";
export type InlineTagName = "script" | "style" | "noscript";

export interface ResolvedInlineContent {
  kind: InlineContentKind;
  value: string;
}

const escapeJsonData = (value: string) =>
  value
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

export const safeJsonLdStringify = (value: unknown): JsonLdContent => {
  const serialized = JSON.stringify(value);

  if (serialized === undefined) {
    throw new TypeError("JSON-LD content must be JSON-serializable");
  }

  return escapeJsonData(serialized) as JsonLdContent;
};

/** Marks trusted JavaScript source for use as inline script content. */
export const createScriptContent = (value: string): ScriptContent => value as ScriptContent;

/** Serializes structured data as valid, script-breakout-safe JSON-LD. */
export const createJsonLdContent = (value: unknown): JsonLdContent => safeJsonLdStringify(value);

/** Marks CSS source for use as inline style content. */
export const createStyleContent = (value: string): StyleContent => value as StyleContent;

/** Marks trusted HTML for use inside a noscript element. */
export const createNoscriptHtml = (value: string): NoscriptHtml => value as NoscriptHtml;

const serializeJsonLd = (value: string) => {
  try {
    return safeJsonLdStringify(JSON.parse(value));
  } catch {
    // Invalid legacy JSON-LD remains diagnosable, but cannot terminate its script element.
    return escapeJsonData(value);
  }
};

export const serializeInlineContent = (kind: InlineContentKind, value: string): string => {
  switch (kind) {
    case "json-ld":
      return serializeJsonLd(value);
    case "script":
      return value.replace(/<\/script/gi, "<\\/script");
    case "style":
      return value.replace(/<\/style/gi, "<\\/style");
    case "noscript":
      return value.replace(/<\/noscript/gi, "&lt;/noscript");
  }
};

export const resolveInlineContent = (
  tagName: InlineTagName,
  attributes: Record<string, unknown>,
): ResolvedInlineContent | undefined => {
  if (tagName === "script") {
    if (typeof attributes.jsonLd === "string") {
      return { kind: "json-ld", value: attributes.jsonLd };
    }
    if (typeof attributes.scriptContent === "string") {
      return { kind: "script", value: attributes.scriptContent };
    }
    if (typeof attributes.innerHTML === "string") {
      return {
        kind: String(attributes.type).toLowerCase() === "application/ld+json" ? "json-ld" : "script",
        value: attributes.innerHTML,
      };
    }
    return undefined;
  }

  if (tagName === "style") {
    const value = attributes.styleContent ?? attributes.cssText;
    return typeof value === "string" ? { kind: "style", value } : undefined;
  }

  const value = attributes.htmlContent ?? attributes.innerHTML;
  return typeof value === "string" ? { kind: "noscript", value } : undefined;
};

export const INLINE_CONTENT_KEYS = new Set([
  "cssText",
  "htmlContent",
  "innerHTML",
  "jsonLd",
  "scriptContent",
  "styleContent",
]);
