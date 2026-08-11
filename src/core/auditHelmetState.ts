import {
  HELMET_RULE_IDS,
  HELMET_SECURITY_RULE_IDS,
  HELMET_SEO_RULE_IDS,
  type AuditHelmetStateOptions,
  type HelmetAuditResult,
  type HelmetAttributes,
  type HelmetDiagnostic,
  type HelmetDiagnosticSeverity,
  type HelmetDiagnosticSource,
  type HelmetDiagnosticSuppression,
  type HelmetDiagnosticTagName,
  type HelmetRuleId,
  type HelmetSecurityRuleId,
  type HelmetState,
  type LinkTag,
  type MetaTag,
} from "../types";
import { JsonLdGraph } from "../utils/jsonLdGraph";
import { validateIntegrity } from "../utils/subresourceIntegrity";

type UrlKind = "document" | "image" | "refresh" | "resource";

interface UrlLocation {
  attribute: string;
  kind: UrlKind;
  requireAbsolute?: boolean;
  requireHttps?: boolean;
  source: HelmetDiagnosticSource;
  value: string;
}

interface ClassifiedUrl {
  normalized: string;
  scheme?: string;
  type:
    | "absolute"
    | "blob"
    | "custom"
    | "dangerous"
    | "data"
    | "invalid"
    | "protocol-relative"
    | "relative";
}

const DANGEROUS_SCHEMES = new Set(["javascript", "vbscript"]);
const KNOWN_UNEXPECTED_SCHEMES = new Set([
  "file",
  "ftp",
  "mailto",
  "tel",
  "ws",
  "wss",
]);
const URL_META_PROPERTIES = new Map<string, UrlKind>([
  ["contenturl", "resource"],
  ["embedurl", "resource"],
  ["og:audio", "resource"],
  ["og:audio:secure_url", "resource"],
  ["og:audio:url", "resource"],
  ["og:image", "image"],
  ["og:image:secure_url", "image"],
  ["og:image:url", "image"],
  ["og:url", "document"],
  ["og:video", "resource"],
  ["og:video:secure_url", "resource"],
  ["og:video:url", "resource"],
  ["twitter:image", "image"],
  ["twitter:image:src", "image"],
  ["twitter:player", "resource"],
  ["twitter:player:stream", "resource"],
  ["twitter:url", "document"],
]);
const SUSPICIOUS_ATTRIBUTE_NAMES = new Set([
  "__proto__",
  "constructor",
  "dangerouslysetinnerhtml",
  "prototype",
]);
const ATTRIBUTE_NAME_PATTERN = /^[A-Za-z_:][A-Za-z0-9_.:-]*$/;
const CONTROL_OR_SPACE_PATTERN = /[\u0000-\u0020\u007f-\u009f]/g;
const BCP47_PATTERN =
  /^(?:[a-zA-Z]{2,3}(?:-[a-zA-Z]{4})?(?:-(?:[a-zA-Z]{2}|\d{3}))?|x-default)$/i;
const DATE_PROPERTIES = new Set([
  "article:published_time",
  "article:modified_time",
  "article:expiration_time",
  "og:updated_time",
]);

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&#(\d+);?/gi, (_match, code: string) =>
      String.fromCharCode(Number.parseInt(code, 10)),
    )
    .replace(/&#x([0-9a-f]+);?/gi, (_match, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replace(/&colon;?/gi, ":")
    .replace(/&newline;?/gi, "\n")
    .replace(/&tab;?/gi, "\t");

const decodeUrlForInspection = (value: string) => {
  let decoded = decodeHtmlEntities(value);

  for (let pass = 0; pass < 3; pass += 1) {
    const next = decoded.replace(/%([0-9a-f]{2})/gi, (_match, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    );

    if (next === decoded) {
      break;
    }

    decoded = decodeHtmlEntities(next);
  }

  return decoded.trim();
};

const normalizeSchemePrefix = (value: string) => {
  const colonIndex = value.indexOf(":");

  if (colonIndex < 0) {
    return value;
  }

  const prefix = value
    .slice(0, colonIndex)
    .replace(CONTROL_OR_SPACE_PATTERN, "");
  return `${prefix}${value.slice(colonIndex)}`;
};

const classifyUrl = (value: string): ClassifiedUrl => {
  const normalized = normalizeSchemePrefix(decodeUrlForInspection(value));

  if (normalized.startsWith("//") || normalized.startsWith("\\\\")) {
    return { normalized, type: "protocol-relative" };
  }

  const schemeMatch = normalized.match(/^([a-z][a-z0-9+.-]*):/i);
  if (!schemeMatch) {
    return {
      normalized,
      type: normalized.includes(":") ? "invalid" : "relative",
    };
  }

  const scheme = schemeMatch[1].toLowerCase();

  if (DANGEROUS_SCHEMES.has(scheme)) {
    return { normalized, scheme, type: "dangerous" };
  }

  if (scheme === "data") {
    return { normalized, scheme, type: "data" };
  }

  if (scheme === "blob") {
    return { normalized, scheme, type: "blob" };
  }

  if (scheme === "http" || scheme === "https") {
    return { normalized, scheme, type: "absolute" };
  }

  return {
    normalized,
    scheme,
    type: KNOWN_UNEXPECTED_SCHEMES.has(scheme) ? "invalid" : "custom",
  };
};

const getMetaUrlKind = (tag: Record<string, unknown>): UrlKind | undefined => {
  const property =
    typeof tag.property === "string"
      ? tag.property.toLowerCase()
      : typeof tag.name === "string"
        ? tag.name.toLowerCase()
        : typeof tag.itemProp === "string"
          ? tag.itemProp.toLowerCase()
          : "";

  if (URL_META_PROPERTIES.has(property)) {
    return URL_META_PROPERTIES.get(property);
  }

  if (property === "image" || property === "thumbnailurl") {
    return "image";
  }

  if (property === "url") {
    return "document";
  }

  return undefined;
};

const extractRefreshUrl = (content: string) => {
  const match = content.match(/(?:^|;)\s*url\s*=\s*(.*?)\s*$/i);
  if (!match) {
    return undefined;
  }

  const value = match[1];
  if (
    value.length >= 2 &&
    ((value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

const createSource = (
  tagName: HelmetDiagnosticTagName,
  tag?: HelmetAttributes,
  attribute?: string,
  tagIndex?: number,
): HelmetDiagnosticSource => ({
  attribute,
  tag: tag ? { ...tag } : undefined,
  tagIndex,
  tagName,
});

const collectUrlLocations = (state: HelmetState): UrlLocation[] => {
  const locations: UrlLocation[] = [];

  state.base.forEach((tag, tagIndex) => {
    if (typeof tag.href === "string") {
      locations.push({
        attribute: "href",
        kind: "document",
        requireAbsolute: true,
        source: createSource("base", tag, "href", tagIndex),
        value: tag.href,
      });
    }
  });

  state.link.forEach((tag, tagIndex) => {
    if (typeof tag.href !== "string") {
      return;
    }

    const rel = typeof tag.rel === "string" ? tag.rel.toLowerCase() : "";
    locations.push({
      attribute: "href",
      kind: rel.includes("icon")
        ? "image"
        : rel === "canonical" || rel === "alternate"
          ? "document"
          : "resource",
      requireAbsolute: rel === "canonical",
      source: createSource("link", tag, "href", tagIndex),
      value: tag.href,
    });
  });

  state.script.forEach((tag, tagIndex) => {
    if (typeof tag.src === "string") {
      locations.push({
        attribute: "src",
        kind: "resource",
        source: createSource("script", tag, "src", tagIndex),
        value: tag.src,
      });
    }
  });

  state.meta.forEach((tag, tagIndex) => {
    if (typeof tag.content !== "string") {
      return;
    }

    if (
      typeof tag.httpEquiv === "string" &&
      tag.httpEquiv.toLowerCase() === "refresh"
    ) {
      const refreshUrl = extractRefreshUrl(tag.content);
      if (refreshUrl !== undefined) {
        locations.push({
          attribute: "content",
          kind: "refresh",
          source: createSource("meta", tag, "content", tagIndex),
          value: refreshUrl,
        });
      }
      return;
    }

    const kind = getMetaUrlKind(tag);
    if (kind) {
      const property = String(
        tag.property ?? tag.name ?? tag.itemProp ?? "",
      ).toLowerCase();
      locations.push({
        attribute: "content",
        kind,
        requireAbsolute: property === "og:url" || property === "twitter:url",
        requireHttps: property.endsWith(":secure_url"),
        source: createSource("meta", tag, "content", tagIndex),
        value: tag.content,
      });
    }
  });

  return locations;
};

const collectAttributeSources = (
  state: HelmetState,
): HelmetDiagnosticSource[] => {
  const sources: HelmetDiagnosticSource[] = [];
  const addAttributes = (
    tagName: HelmetDiagnosticTagName,
    tag: HelmetAttributes,
    tagIndex?: number,
  ) => {
    Object.keys(tag).forEach((attribute) => {
      sources.push(createSource(tagName, tag, attribute, tagIndex));
    });
  };

  addAttributes("bodyAttributes", state.bodyAttributes);
  addAttributes("htmlAttributes", state.htmlAttributes);
  addAttributes("titleAttributes", state.titleAttributes);

  (["base", "link", "meta", "noscript", "script", "style"] as const).forEach(
    (tagName) => {
      state[tagName].forEach((tag, tagIndex) =>
        addAttributes(tagName, tag, tagIndex),
      );
    },
  );

  return sources;
};

const isSuppressed = (
  id: HelmetRuleId,
  source: HelmetDiagnosticSource,
  suppressions: Array<HelmetRuleId | HelmetDiagnosticSuppression>,
) =>
  suppressions.some((suppression) => {
    if (typeof suppression === "string") {
      return suppression === id;
    }

    return (
      suppression.ruleId === id &&
      (suppression.tagName === undefined ||
        suppression.tagName === source.tagName) &&
      (suppression.tagIndex === undefined ||
        suppression.tagIndex === source.tagIndex) &&
      (suppression.attribute === undefined ||
        suppression.attribute === source.attribute)
    );
  });

const defaultUrlSeverity = (
  id: HelmetRuleId,
  context: "raw" | "seo",
  location: UrlLocation,
): HelmetDiagnosticSeverity => {
  if (id === HELMET_SECURITY_RULE_IDS.DANGEROUS_URL_SCHEME) {
    return "error";
  }

  if (
    context === "seo" &&
    (id === HELMET_SECURITY_RULE_IDS.DATA_URL ||
      id === HELMET_SECURITY_RULE_IDS.BLOB_URL ||
      id === HELMET_SECURITY_RULE_IDS.CUSTOM_URL_SCHEME ||
      id === HELMET_SECURITY_RULE_IDS.UNEXPECTED_URL_SCHEME)
  ) {
    return "error";
  }

  if (
    location.kind === "refresh" ||
    (id === HELMET_SECURITY_RULE_IDS.DATA_URL && location.kind !== "image")
  ) {
    return "error";
  }

  return "warning";
};

const getUrlDiagnostic = (
  location: UrlLocation,
  context: "raw" | "seo",
): Omit<HelmetDiagnostic, "severity"> | undefined => {
  const classified = classifyUrl(location.value);

  if (classified.type === "dangerous") {
    return {
      id: HELMET_SECURITY_RULE_IDS.DANGEROUS_URL_SCHEME,
      message: `The ${location.source.tagName} ${location.attribute} uses the dangerous ${classified.scheme}: scheme.`,
      source: location.source,
      value: location.value,
    };
  }

  if (classified.type === "data") {
    return {
      id: HELMET_SECURITY_RULE_IDS.DATA_URL,
      message: `The ${location.source.tagName} ${location.attribute} uses a data: URL; allow it only when the tag context and payload are trusted.`,
      source: location.source,
      value: location.value,
    };
  }

  if (classified.type === "blob") {
    return {
      id: HELMET_SECURITY_RULE_IDS.BLOB_URL,
      message: `The ${location.source.tagName} ${location.attribute} uses a blob: URL whose lifetime and origin must be controlled by the application.`,
      source: location.source,
      value: location.value,
    };
  }

  if (classified.type === "protocol-relative") {
    return {
      id: HELMET_SECURITY_RULE_IDS.PROTOCOL_RELATIVE_URL,
      message: `The ${location.source.tagName} ${location.attribute} is protocol-relative; prefer an explicit https: URL.`,
      source: location.source,
      value: location.value,
    };
  }

  if (classified.type === "custom") {
    return {
      id: HELMET_SECURITY_RULE_IDS.CUSTOM_URL_SCHEME,
      message: `The ${location.source.tagName} ${location.attribute} uses the custom ${classified.scheme}: scheme.`,
      source: location.source,
      value: location.value,
    };
  }

  if (classified.type === "invalid") {
    return {
      id: HELMET_SECURITY_RULE_IDS.UNEXPECTED_URL_SCHEME,
      message: `The ${location.source.tagName} ${location.attribute} uses an unexpected or malformed URL scheme.`,
      source: location.source,
      value: location.value,
    };
  }

  if (
    context === "seo" &&
    location.requireAbsolute &&
    classified.type === "relative"
  ) {
    return {
      id: HELMET_SECURITY_RULE_IDS.UNEXPECTED_URL_SCHEME,
      message: `The ${location.source.tagName} ${location.attribute} requires an absolute http: or https: URL in the SEO policy.`,
      source: location.source,
      value: location.value,
    };
  }

  if (
    context === "seo" &&
    location.requireHttps &&
    classified.scheme !== "https"
  ) {
    return {
      id: HELMET_SECURITY_RULE_IDS.UNEXPECTED_URL_SCHEME,
      message: `The ${location.source.tagName} ${location.attribute} requires an https: URL in the SEO policy.`,
      source: location.source,
      value: location.value,
    };
  }

  return undefined;
};

const addDiagnostic = (
  diagnostics: HelmetDiagnostic[],
  diagnostic: Omit<HelmetDiagnostic, "severity">,
  defaultSeverity: HelmetDiagnosticSeverity,
  options: AuditHelmetStateOptions,
) => {
  const severity = options.severities?.[diagnostic.id] ?? defaultSeverity;
  if (
    severity === "off" ||
    isSuppressed(diagnostic.id, diagnostic.source, options.suppressions ?? [])
  ) {
    return;
  }

  diagnostics.push({ ...diagnostic, severity });
};

/* --- SEO Audit Rule Implementations --- */

const auditTitleAndBase = (
  state: HelmetState,
  options: AuditHelmetStateOptions,
  diagnostics: HelmetDiagnostic[],
) => {
  if (state.title === undefined || state.title === null) {
    if (options.context === "seo") {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.TITLE_MISSING,
          message: "Page title is missing.",
          source: createSource("title"),
        },
        "warning",
        options,
      );
    }
  } else {
    const trimmed = state.title.trim();
    if (trimmed.length === 0) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.TITLE_EMPTY,
          message: "Page title is empty.",
          source: createSource("title"),
          value: state.title,
        },
        "error",
        options,
      );
    } else if (trimmed.length < 10) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.TITLE_TOO_SHORT,
          message: `Page title "${trimmed}" is too short (${trimmed.length} chars). Recommended minimum is 10 characters.`,
          source: createSource("title"),
          value: state.title,
        },
        "suggestion",
        options,
      );
    } else if (trimmed.length > 60) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.TITLE_TOO_LONG,
          message: `Page title is too long (${trimmed.length} chars). Recommended maximum is 60 characters for optimal search result display.`,
          source: createSource("title"),
          value: state.title,
        },
        "suggestion",
        options,
      );
    }
  }

  if (state.base.length > 1) {
    state.base.slice(1).forEach((tag, idx) => {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.BASE_MULTIPLE,
          message:
            "Multiple <base> tags detected. Only one <base> tag is allowed per document.",
          source: createSource("base", tag, "href", idx + 1),
          value: tag.href,
        },
        "error",
        options,
      );
    });
  }
};

const auditDescription = (
  state: HelmetState,
  options: AuditHelmetStateOptions,
  diagnostics: HelmetDiagnostic[],
) => {
  const descMetas: Array<{ index: number; tag: MetaTag }> = [];
  state.meta.forEach((tag, index) => {
    if (
      typeof tag.name === "string" &&
      tag.name.toLowerCase() === "description"
    ) {
      descMetas.push({ index, tag });
    }
  });

  if (descMetas.length === 0) {
    if (options.context === "seo") {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.DESCRIPTION_MISSING,
          message: "Meta description tag is missing.",
          source: createSource("meta"),
        },
        "warning",
        options,
      );
    }
  } else {
    if (descMetas.length > 1) {
      descMetas.slice(1).forEach(({ index, tag }) => {
        addDiagnostic(
          diagnostics,
          {
            id: HELMET_SEO_RULE_IDS.DESCRIPTION_DUPLICATE,
            message: "Multiple meta description tags detected.",
            source: createSource("meta", tag, "name", index),
            value: tag.content,
          },
          "warning",
          options,
        );
      });
    }

    const first = descMetas[0];
    const content =
      typeof first.tag.content === "string" ? first.tag.content.trim() : "";
    if (content.length === 0) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.DESCRIPTION_EMPTY,
          message: "Meta description is empty.",
          source: createSource("meta", first.tag, "content", first.index),
          value: first.tag.content,
        },
        "error",
        options,
      );
    } else if (content.length < 50) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.DESCRIPTION_TOO_SHORT,
          message: `Meta description is too short (${content.length} chars). Recommended minimum is 50 characters.`,
          source: createSource("meta", first.tag, "content", first.index),
          value: first.tag.content,
        },
        "suggestion",
        options,
      );
    } else if (content.length > 160) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.DESCRIPTION_TOO_LONG,
          message: `Meta description is too long (${content.length} chars). Recommended maximum is 160 characters.`,
          source: createSource("meta", first.tag, "content", first.index),
          value: first.tag.content,
        },
        "suggestion",
        options,
      );
    }
  }
};

const auditCanonical = (
  state: HelmetState,
  options: AuditHelmetStateOptions,
  diagnostics: HelmetDiagnostic[],
) => {
  const canonicalLinks: Array<{ index: number; tag: LinkTag }> = [];
  state.link.forEach((tag, index) => {
    const rel = typeof tag.rel === "string" ? tag.rel.toLowerCase() : "";
    if (rel === "canonical") {
      canonicalLinks.push({ index, tag });
    }
  });

  if (canonicalLinks.length === 0) {
    if (options.context === "seo") {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.CANONICAL_MISSING,
          message: "Canonical link (<link rel=\"canonical\">) is missing.",
          source: createSource("link"),
        },
        "warning",
        options,
      );
    }
  } else {
    if (canonicalLinks.length > 1) {
      canonicalLinks.slice(1).forEach(({ index, tag }) => {
        addDiagnostic(
          diagnostics,
          {
            id: HELMET_SEO_RULE_IDS.CANONICAL_DUPLICATE,
            message: "Multiple canonical links detected.",
            source: createSource("link", tag, "rel", index),
            value: tag.href,
          },
          "error",
          options,
        );
      });
    }

    const first = canonicalLinks[0];
    const href =
      typeof first.tag.href === "string" ? first.tag.href.trim() : "";
    const classified = classifyUrl(href);
    if (classified.type === "relative") {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.CANONICAL_INVALID_URL,
          message: `Canonical link href "${href}" must be an absolute URL (http:// or https://).`,
          source: createSource("link", first.tag, "href", first.index),
          value: first.tag.href,
        },
        options.context === "seo" ? "error" : "warning",
        options,
      );
    }
  }
};

const auditRobots = (
  state: HelmetState,
  options: AuditHelmetStateOptions,
  diagnostics: HelmetDiagnostic[],
) => {
  const robotsMetas: Array<{ index: number; tag: MetaTag }> = [];
  state.meta.forEach((tag, index) => {
    const name = typeof tag.name === "string" ? tag.name.toLowerCase() : "";
    if (name === "robots" || name === "googlebot") {
      robotsMetas.push({ index, tag });
    }
  });

  if (robotsMetas.length > 1) {
    robotsMetas.slice(1).forEach(({ index, tag }) => {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.ROBOTS_DUPLICATE,
          message: `Multiple meta ${tag.name} tags detected.`,
          source: createSource("meta", tag, "name", index),
          value: tag.content,
        },
        "warning",
        options,
      );
    });
  }

  let hasNoIndex = false;

  robotsMetas.forEach(({ index, tag }) => {
    const content =
      typeof tag.content === "string" ? tag.content.toLowerCase() : "";
    const directives = new Set(content.split(/[\s,]+/).filter(Boolean));

    const conflicts: string[] = [];
    if (directives.has("index") && directives.has("noindex")) {
      conflicts.push("index vs noindex");
    }
    if (directives.has("follow") && directives.has("nofollow")) {
      conflicts.push("follow vs nofollow");
    }
    if (directives.has("all") && directives.has("none")) {
      conflicts.push("all vs none");
    }
    if (
      directives.has("none") &&
      (directives.has("index") || directives.has("follow"))
    ) {
      conflicts.push("none vs index/follow");
    }

    if (conflicts.length > 0) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.ROBOTS_CONFLICT,
          message: `Conflicting directives found in meta ${tag.name}: ${conflicts.join(", ")}.`,
          source: createSource("meta", tag, "content", index),
          value: tag.content,
        },
        "error",
        options,
      );
    }

    if (directives.has("noindex") || directives.has("none")) {
      hasNoIndex = true;
    }
  });

  const hasCanonical = state.link.some(
    (tag) =>
      typeof tag.rel === "string" &&
      tag.rel.toLowerCase() === "canonical" &&
      Boolean(tag.href),
  );

  if (hasNoIndex && hasCanonical) {
    const noindexSource = robotsMetas[0]
      ? createSource("meta", robotsMetas[0].tag, "content", robotsMetas[0].index)
      : createSource("meta");

    addDiagnostic(
      diagnostics,
      {
        id: HELMET_SEO_RULE_IDS.NOINDEX_CANONICAL_CONFLICT,
        message:
          "Page specifies 'noindex' directive alongside a canonical link. Pages marked noindex should generally not specify a canonical link.",
        source: noindexSource,
      },
      "warning",
      options,
    );
  }
};

const auditOpenGraph = (
  state: HelmetState,
  options: AuditHelmetStateOptions,
  diagnostics: HelmetDiagnostic[],
) => {
  const ogMap = new Map<string, Array<{ index: number; tag: MetaTag }>>();
  state.meta.forEach((tag, index) => {
    const prop =
      typeof tag.property === "string" ? tag.property.toLowerCase() : "";
    if (prop.startsWith("og:")) {
      if (!ogMap.has(prop)) {
        ogMap.set(prop, []);
      }
      ogMap.get(prop)!.push({ index, tag });
    }
  });

  if (ogMap.size === 0) {
    return;
  }

  const singleValueOgProps = new Set([
    "og:title",
    "og:description",
    "og:url",
    "og:type",
    "og:site_name",
    "og:determiner",
    "og:locale",
  ]);

  ogMap.forEach((entries, prop) => {
    if (singleValueOgProps.has(prop) && entries.length > 1) {
      entries.slice(1).forEach(({ index, tag }) => {
        addDiagnostic(
          diagnostics,
          {
            id: HELMET_SEO_RULE_IDS.OG_DUPLICATE,
            message: `Multiple definitions for single-value Open Graph property "${prop}".`,
            source: createSource("meta", tag, "property", index),
            value: tag.content,
          },
          "warning",
          options,
        );
      });
    }
  });

  const requiredOgProps = [
    "og:title",
    "og:description",
    "og:image",
    "og:url",
    "og:type",
  ];
  const missingOgProps = requiredOgProps.filter(
    (p) => !ogMap.has(p) || !ogMap.get(p)![0]?.tag.content,
  );

  if (options.context === "seo" && missingOgProps.length > 0) {
    const firstOg = Array.from(ogMap.values())[0]?.[0];
    addDiagnostic(
      diagnostics,
      {
        id: HELMET_SEO_RULE_IDS.OG_INCOMPLETE,
        message: `Incomplete Open Graph metadata. Missing recommended properties: ${missingOgProps.join(", ")}.`,
        source: firstOg
          ? createSource("meta", firstOg.tag, "property", firstOg.index)
          : createSource("meta"),
      },
      "suggestion",
      options,
    );
  }

  const ogUrlTag = ogMap.get("og:url")?.[0]?.tag;
  const canonicalTag = state.link.find(
    (tag) =>
      typeof tag.rel === "string" &&
      tag.rel.toLowerCase() === "canonical" &&
      Boolean(tag.href),
  );

  if (
    ogUrlTag &&
    typeof ogUrlTag.content === "string" &&
    canonicalTag &&
    typeof canonicalTag.href === "string"
  ) {
    const ogUrl = ogUrlTag.content.trim().replace(/\/$/, "");
    const canonicalUrl = canonicalTag.href.trim().replace(/\/$/, "");
    if (ogUrl !== canonicalUrl) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.OG_CANONICAL_MISMATCH,
          message: `Open Graph url ("${ogUrlTag.content}") does not match canonical link ("${canonicalTag.href}").`,
          source: createSource(
            "meta",
            ogUrlTag,
            "content",
            ogMap.get("og:url")![0].index,
          ),
          value: ogUrlTag.content,
        },
        "warning",
        options,
      );
    }
  }
};

const auditTwitter = (
  state: HelmetState,
  options: AuditHelmetStateOptions,
  diagnostics: HelmetDiagnostic[],
) => {
  const twitterMap = new Map<string, Array<{ index: number; tag: MetaTag }>>();
  state.meta.forEach((tag, index) => {
    const name = typeof tag.name === "string" ? tag.name.toLowerCase() : "";
    if (name.startsWith("twitter:")) {
      if (!twitterMap.has(name)) {
        twitterMap.set(name, []);
      }
      twitterMap.get(name)!.push({ index, tag });
    }
  });

  if (twitterMap.size === 0) {
    return;
  }

  const singleValueTwitterProps = new Set([
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
    "twitter:site",
    "twitter:creator",
  ]);

  twitterMap.forEach((entries, name) => {
    if (singleValueTwitterProps.has(name) && entries.length > 1) {
      entries.slice(1).forEach(({ index, tag }) => {
        addDiagnostic(
          diagnostics,
          {
            id: HELMET_SEO_RULE_IDS.TWITTER_DUPLICATE,
            message: `Multiple definitions for single-value Twitter property "${name}".`,
            source: createSource("meta", tag, "name", index),
            value: tag.content,
          },
          "warning",
          options,
        );
      });
    }
  });

  const cardTag = twitterMap.get("twitter:card")?.[0];
  if (cardTag) {
    const hasTitle =
      twitterMap.has("twitter:title") ||
      Boolean(state.title) ||
      state.meta.some(
        (m) =>
          typeof m.property === "string" &&
          m.property.toLowerCase() === "og:title" &&
          Boolean(m.content),
      );
    const hasDesc =
      twitterMap.has("twitter:description") ||
      state.meta.some(
        (m) =>
          ((typeof m.name === "string" &&
            m.name.toLowerCase() === "description") ||
            (typeof m.property === "string" &&
              m.property.toLowerCase() === "og:description")) &&
          Boolean(m.content),
      );
    const cardValue = String(cardTag.tag.content ?? "").toLowerCase();

    const missingFields: string[] = [];
    if (!hasTitle) {
      missingFields.push("twitter:title");
    }
    if (!hasDesc) {
      missingFields.push("twitter:description");
    }
    if (
      cardValue === "summary_large_image" &&
      !twitterMap.has("twitter:image") &&
      !state.meta.some(
        (m) =>
          typeof m.property === "string" &&
          m.property.toLowerCase() === "og:image" &&
          Boolean(m.content),
      )
    ) {
      missingFields.push("twitter:image");
    }

    if (missingFields.length > 0) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.TWITTER_INCOMPLETE,
          message: `Incomplete Twitter Card metadata for card type "${cardTag.tag.content}". Missing required fields: ${missingFields.join(", ")}.`,
          source: createSource("meta", cardTag.tag, "content", cardTag.index),
          value: cardTag.tag.content,
        },
        "warning",
        options,
      );
    }
  }
};

const auditHreflang = (
  state: HelmetState,
  options: AuditHelmetStateOptions,
  diagnostics: HelmetDiagnostic[],
) => {
  const hreflangLinks: Array<{ index: number; tag: LinkTag }> = [];
  state.link.forEach((tag, index) => {
    const rel = typeof tag.rel === "string" ? tag.rel.toLowerCase() : "";
    if (rel === "alternate" && typeof tag.hrefLang === "string") {
      hreflangLinks.push({ index, tag });
    }
  });

  if (hreflangLinks.length === 0) {
    return;
  }

  const seenCodes = new Set<string>();
  let hasXDefault = false;

  hreflangLinks.forEach(({ index, tag }) => {
    const lang = String(tag.hrefLang).trim();
    if (!BCP47_PATTERN.test(lang)) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.HREFLANG_INVALID_CODE,
          message: `Invalid hreflang language code "${lang}". Expected a valid BCP 47 language code (e.g. "en", "en-US", "x-default").`,
          source: createSource("link", tag, "hrefLang", index),
          value: lang,
        },
        "error",
        options,
      );
    }

    if (lang.toLowerCase() === "x-default") {
      hasXDefault = true;
    }

    const lowerLang = lang.toLowerCase();
    if (seenCodes.has(lowerLang)) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.HREFLANG_DUPLICATE,
          message: `Duplicate hreflang tag for language "${lang}".`,
          source: createSource("link", tag, "hrefLang", index),
          value: lang,
        },
        "warning",
        options,
      );
    } else {
      seenCodes.add(lowerLang);
    }

    const href = typeof tag.href === "string" ? tag.href.trim() : "";
    if (classifyUrl(href).type !== "absolute") {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.HREFLANG_INVALID_URL,
          message: `Hreflang link href "${href}" must be an absolute URL (http:// or https://).`,
          source: createSource("link", tag, "href", index),
          value: tag.href,
        },
        "warning",
        options,
      );
    }
  });

  if (hreflangLinks.length >= 2 && !hasXDefault) {
    addDiagnostic(
      diagnostics,
      {
        id: HELMET_SEO_RULE_IDS.HREFLANG_MISSING_X_DEFAULT,
        message:
          "Multiple hreflang links exist but no fallback 'x-default' hreflang tag is specified.",
        source: createSource(
          "link",
          hreflangLinks[0].tag,
          "hrefLang",
          hreflangLinks[0].index,
        ),
      },
      "suggestion",
      options,
    );
  }
};

const auditImageMetadata = (
  state: HelmetState,
  options: AuditHelmetStateOptions,
  diagnostics: HelmetDiagnostic[],
) => {
  const ogImageIndex = state.meta.findIndex(
    (tag) =>
      typeof tag.property === "string" &&
      tag.property.toLowerCase() === "og:image" &&
      Boolean(tag.content),
  );

  if (options.context === "seo" && ogImageIndex >= 0) {
    const hasAlt = state.meta.some(
      (tag) =>
        typeof tag.property === "string" &&
        tag.property.toLowerCase() === "og:image:alt" &&
        Boolean(tag.content),
    );

    if (!hasAlt) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.IMAGE_ALT_MISSING,
          message:
            "Open Graph image (og:image) is present but missing accessible alt text (og:image:alt).",
          source: createSource(
            "meta",
            state.meta[ogImageIndex],
            "property",
            ogImageIndex,
          ),
        },
        "suggestion",
        options,
      );
    }
  }

  state.meta.forEach((tag, index) => {
    const prop =
      typeof tag.property === "string" ? tag.property.toLowerCase() : "";
    if (prop === "og:image:width" || prop === "og:image:height") {
      const val = Number(tag.content);
      if (Number.isNaN(val) || val <= 0) {
        addDiagnostic(
          diagnostics,
          {
            id: HELMET_SEO_RULE_IDS.IMAGE_INVALID_DIMENSIONS,
            message: `Invalid dimension attribute for "${prop}": "${tag.content}". Must be a positive integer.`,
            source: createSource("meta", tag, "content", index),
            value: tag.content,
          },
          "warning",
          options,
        );
      }
    }

    if (
      (prop === "og:image" ||
        prop === "og:image:url" ||
        prop === "og:image:secure_url" ||
        (typeof tag.name === "string" &&
          tag.name.toLowerCase() === "twitter:image")) &&
      typeof tag.content === "string"
    ) {
      const classified = classifyUrl(tag.content);
      if (
        options.context === "seo" &&
        classified.type !== "absolute" &&
        classified.type !== "data"
      ) {
        addDiagnostic(
          diagnostics,
          {
            id: HELMET_SEO_RULE_IDS.IMAGE_URL_INVALID,
            message: `Image URL "${tag.content}" for ${prop} should be an absolute URL in SEO policy.`,
            source: createSource("meta", tag, "content", index),
            value: tag.content,
          },
          "warning",
          options,
        );
      }
    }
  });
};

const auditDates = (
  state: HelmetState,
  options: AuditHelmetStateOptions,
  diagnostics: HelmetDiagnostic[],
) => {
  let publishedTime: { date: Date; index: number; tag: MetaTag } | undefined;
  let modifiedTime: { date: Date; index: number; tag: MetaTag } | undefined;

  state.meta.forEach((tag, index) => {
    const prop =
      typeof tag.property === "string" ? tag.property.toLowerCase() : "";
    if (DATE_PROPERTIES.has(prop)) {
      const valueStr = String(tag.content ?? "").trim();
      const parsedMs = Date.parse(valueStr);

      if (!valueStr || Number.isNaN(parsedMs)) {
        addDiagnostic(
          diagnostics,
          {
            id: HELMET_SEO_RULE_IDS.DATE_INVALID,
            message: `Invalid ISO 8601 date string "${tag.content}" for property "${tag.property}".`,
            source: createSource("meta", tag, "content", index),
            value: tag.content,
          },
          "error",
          options,
        );
      } else {
        const d = new Date(parsedMs);
        if (prop === "article:published_time") {
          publishedTime = { date: d, index, tag };
        } else if (prop === "article:modified_time") {
          modifiedTime = { date: d, index, tag };
        }

        if (
          prop === "article:published_time" &&
          d.getTime() > Date.now() + 86400000
        ) {
          addDiagnostic(
            diagnostics,
            {
              id: HELMET_SEO_RULE_IDS.DATE_FUTURE,
              message: `Published date "${tag.content}" is set in the future.`,
              source: createSource("meta", tag, "content", index),
              value: tag.content,
            },
            "warning",
            options,
          );
        }
      }
    }
  });

  if (publishedTime && modifiedTime) {
    if (modifiedTime.date.getTime() < publishedTime.date.getTime()) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.DATE_ORDER_INVALID,
          message: `Article modified_time (${modifiedTime.tag.content}) cannot be earlier than published_time (${publishedTime.tag.content}).`,
          source: createSource(
            "meta",
            modifiedTime.tag,
            "content",
            modifiedTime.index,
          ),
          value: modifiedTime.tag.content,
        },
        "error",
        options,
      );
    }
  }
};

const isValidCssSelector = (selector: string): boolean => {
  if (!selector || typeof selector !== "string") return false;
  const trimmed = selector.trim();
  if (trimmed === "") return false;
  return /^[a-zA-Z0-9_.\-#\[\]=~^$*:"'\s>+~,()]+$/.test(trimmed);
};

const auditVerticalSchemas = (
  schema: Record<string, unknown>,
  tag: any,
  index: number,
  options: AuditHelmetStateOptions,
  diagnostics: HelmetDiagnostic[],
) => {
  const type = String(schema["@type"] ?? "");

  if (type === "Product") {
    const offers = schema.offers;
    const offerList = Array.isArray(offers) ? offers : offers ? [offers] : [];
    for (const off of offerList) {
      if (typeof off === "object" && off !== null) {
        const o = off as Record<string, unknown>;
        if (o.price === undefined || o.priceCurrency === undefined) {
          addDiagnostic(
            diagnostics,
            {
              id: HELMET_SEO_RULE_IDS.PRODUCT_OFFER_MISSING_PRICE,
              message: "Product offer is missing required 'price' or 'priceCurrency' field.",
              source: createSource("script", tag, "innerHTML", index),
            },
            "warning",
            options,
          );
          break;
        }
      }
    }
  }

  if (type === "LocalBusiness" || type.endsWith("Store") || type === "Restaurant") {
    if (!schema.address && !schema.geo) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.LOCAL_BUSINESS_MISSING_ADDRESS,
          message: "LocalBusiness schema is missing 'address' or 'geo' coordinates.",
          source: createSource("script", tag, "innerHTML", index),
        },
        "warning",
        options,
      );
    }
  }

  if (type === "VideoObject") {
    if (!schema.thumbnailUrl) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.VIDEO_MISSING_THUMBNAIL,
          message: "VideoObject schema is missing required 'thumbnailUrl' property.",
          source: createSource("script", tag, "innerHTML", index),
        },
        "warning",
        options,
      );
    }
  }

  if (schema.isAccessibleForFree === false) {
    const hasPart = schema.hasPart;
    const partsList = Array.isArray(hasPart) ? hasPart : hasPart ? [hasPart] : [];
    if (partsList.length === 0) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SEO_RULE_IDS.PAYWALL_CLOAKING_WARNING,
          message: "Paywalled content (isAccessibleForFree: false) lacks 'hasPart' section definitions for anti-cloaking.",
          source: createSource("script", tag, "innerHTML", index),
        },
        "warning",
        options,
      );
    } else {
      for (const part of partsList) {
        if (typeof part === "object" && part !== null && typeof (part as any).cssSelector === "string") {
          if (!isValidCssSelector((part as any).cssSelector)) {
            addDiagnostic(
              diagnostics,
              {
                id: HELMET_SEO_RULE_IDS.PAYWALL_INVALID_SELECTOR,
                message: `Paywalled content contains invalid CSS selector syntax "${(part as any).cssSelector}".`,
                source: createSource("script", tag, "innerHTML", index),
                value: (part as any).cssSelector,
              },
              "warning",
              options,
            );
          }
        }
      }
    }
  }
};

const auditJsonLd = (
  state: HelmetState,
  options: AuditHelmetStateOptions,
  diagnostics: HelmetDiagnostic[],
) => {
  const graph = new JsonLdGraph();
  
  state.script.forEach((tag, index) => {
    if (
      typeof tag.type === "string" &&
      tag.type.toLowerCase() === "application/ld+json"
    ) {
      const content = String(tag.innerHTML ?? "").trim();
      if (!content) {
        addDiagnostic(
          diagnostics,
          {
            id: HELMET_SEO_RULE_IDS.JSONLD_INVALID,
            message: "JSON-LD script tag is empty.",
            source: createSource("script", tag, "innerHTML", index),
          },
          "error",
          options,
        );
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (err) {
        addDiagnostic(
          diagnostics,
          {
            id: HELMET_SEO_RULE_IDS.JSONLD_INVALID,
            message: `Invalid JSON syntax in JSON-LD script: ${(err as Error).message}`,
            source: createSource("script", tag, "innerHTML", index),
            value: content,
          },
          "error",
          options,
        );
        return;
      }

          const schemas = Array.isArray(parsed) ? parsed : [parsed];
          schemas.forEach((schema) => {
            if (typeof schema === "object" && schema !== null) {
              const s = schema as Record<string, unknown>;
              if (Array.isArray(s["@graph"])) {
                (s["@graph"] as Record<string, unknown>[]).forEach((item) => {
                  if (typeof item === "object" && item !== null) {
                    graph.addEntity(item);
                    auditVerticalSchemas(item, tag, index, options, diagnostics);
                  }
                });
              } else {
                graph.addEntity(s);
                auditVerticalSchemas(s, tag, index, options, diagnostics);
              }


          const contextStr = String(s["@context"] ?? "").toLowerCase();
          if (!contextStr.includes("schema.org") && !s["@graph"]) {
            addDiagnostic(
              diagnostics,
              {
                id: HELMET_SEO_RULE_IDS.JSONLD_MISSING_CONTEXT,
                message:
                  "JSON-LD schema is missing standard @context ('https://schema.org').",
                source: createSource("script", tag, "innerHTML", index),
              },
              "warning",
              options,
            );
          }

          if (!s["@type"] && !s["@graph"]) {
            addDiagnostic(
              diagnostics,
              {
                id: HELMET_SEO_RULE_IDS.JSONLD_MISSING_TYPE,
                message: "JSON-LD schema is missing required @type declaration.",
                source: createSource("script", tag, "innerHTML", index),
              },
              "warning",
              options,
            );
          }
        }
      });
    }
  });

  graph.getConflicts().forEach((conflict) => {
    addDiagnostic(
      diagnostics,
      {
        id: HELMET_SEO_RULE_IDS.GRAPH_CONFLICT,
        message: conflict.reason,
        source: createSource("script"),
        value: conflict.id,
      },
      "warning",
      options,
    );
  });
};

/**
 * Audits an already-reduced Helmet state. It reports problems but never rewrites
 * or sanitizes descriptors, so the same function can be used for client and SSR
 * state without network requests.
 */
const auditSecurityDescriptors = (
  state: HelmetState,
  options: AuditHelmetStateOptions,
  diagnostics: HelmetDiagnostic[],
) => {
  const context = options.context ?? "raw";

  // Security diagnostics
  collectUrlLocations(state).forEach((location) => {
    const diagnostic = getUrlDiagnostic(location, context);
    if (diagnostic) {
      addDiagnostic(
        diagnostics,
        diagnostic,
        defaultUrlSeverity(diagnostic.id, context, location),
        options,
      );
    }
  });

  collectAttributeSources(state).forEach((source) => {
    const value = source.tag ? source.tag[source.attribute ?? ""] : undefined;
    const attrName = source.attribute ?? "";
    const normalizedName = decodeUrlForInspection(attrName)
      .replace(CONTROL_OR_SPACE_PATTERN, "")
      .toLowerCase();

    if (/^on[a-z]/.test(normalizedName) && typeof value === "string") {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SECURITY_RULE_IDS.EVENT_HANDLER_ATTRIBUTE,
          message: `The ${source.tagName} descriptor contains the string event-handler attribute "${source.attribute}".`,
          source,
          value,
        },
        "error",
        options,
      );
      return;
    }

    if (
      attrName &&
      (!ATTRIBUTE_NAME_PATTERN.test(attrName) ||
        SUSPICIOUS_ATTRIBUTE_NAMES.has(normalizedName))
    ) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SECURITY_RULE_IDS.SUSPICIOUS_ATTRIBUTE_NAME,
          message: `The ${source.tagName} descriptor contains the suspicious attribute name "${source.attribute}".`,
          source,
          value: typeof value === "string" ? value : undefined,
        },
        "warning",
        options,
      );
    }
  });
};

const auditResourceHintsAndSecurity = (
  state: HelmetState,
  options: AuditHelmetStateOptions,
  diagnostics: HelmetDiagnostic[],
) => {
  const seenHints = new Set<string>();

  const auditIntegrity = (
    tagName: "link" | "script",
    tag: LinkTag | HelmetState["script"][number],
    index: number,
    urlAttribute: "href" | "src",
  ) => {
    if (typeof tag.integrity !== "string") {
      return;
    }

    const validation = validateIntegrity(tag.integrity);
    if (!validation.valid) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SECURITY_RULE_IDS.INVALID_SRI,
          message: `Invalid Subresource Integrity metadata: ${validation.error}`,
          source: createSource(tagName, tag, "integrity", index),
          value: tag.integrity,
        },
        "warning",
        options,
      );
    }

    const resourceUrl = tag[urlAttribute];
    if (
      typeof resourceUrl === "string" &&
      /^(?:https?:)?\/\//i.test(resourceUrl) &&
      tag.crossOrigin === undefined
    ) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SECURITY_RULE_IDS.SRI_CORS_REQUIRED,
          message: `Subresource Integrity for a cross-origin ${tagName} requires the crossorigin attribute. Use "anonymous" unless the resource requires credentials.`,
          source: createSource(tagName, tag, "crossOrigin", index),
          value: resourceUrl,
        },
        "warning",
        options,
      );
    }
  };

  state.link.forEach((tag, index) => {
    auditIntegrity("link", tag, index, "href");
    if (tag.rel === "preconnect" || tag.rel === "dns-prefetch") {
      const key = `${tag.rel}:${tag.href}`;
      if (seenHints.has(key)) {
        addDiagnostic(
          diagnostics,
          {
            id: HELMET_SECURITY_RULE_IDS.DUPLICATE_RESOURCE_HINT,
            message: `Duplicate ${tag.rel} link hint for target URL "${tag.href}".`,
            source: createSource("link", tag, "href", index),
            value: tag.href,
          },
          "warning",
          options,
        );
      } else {
        seenHints.add(key);
      }
    }

    if (
      tag.rel === "stylesheet" &&
      typeof tag.href === "string" &&
      tag.href.startsWith("http") &&
      tag.crossOrigin &&
      !tag.integrity
    ) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SECURITY_RULE_IDS.MISSING_SRI,
          message: `Cross-origin stylesheet "${tag.href}" is missing Subresource Integrity (integrity) attribute.`,
          source: createSource("link", tag, "href", index),
          value: tag.href,
        },
        "suggestion",
        options,
      );
    }
  });

  state.script.forEach((tag, index) => {
    auditIntegrity("script", tag, index, "src");
    if (
      typeof tag.src === "string" &&
      tag.src.startsWith("http") &&
      tag.crossOrigin &&
      !tag.integrity
    ) {
      addDiagnostic(
        diagnostics,
        {
          id: HELMET_SECURITY_RULE_IDS.MISSING_SRI,
          message: `Cross-origin script "${tag.src}" is missing Subresource Integrity (integrity) attribute.`,
          source: createSource("script", tag, "src", index),
          value: tag.src,
        },
        "suggestion",
        options,
      );
    }
  });
};

export const auditHelmetState = (
  state: HelmetState,
  options: AuditHelmetStateOptions = {},
): HelmetAuditResult => {
  const diagnostics: HelmetDiagnostic[] = [];

  // Security diagnostics
  auditSecurityDescriptors(state, options, diagnostics);
  
  // SEO diagnostics
  auditTitleAndBase(state, options, diagnostics);
  auditDescription(state, options, diagnostics);
  auditCanonical(state, options, diagnostics);
  auditRobots(state, options, diagnostics);
  auditOpenGraph(state, options, diagnostics);
  auditTwitter(state, options, diagnostics);
  auditHreflang(state, options, diagnostics);
  auditImageMetadata(state, options, diagnostics);
  auditDates(state, options, diagnostics);
  auditJsonLd(state, options, diagnostics);
  auditResourceHintsAndSecurity(state, options, diagnostics);

  const errors = diagnostics.filter(
    (diagnostic) => diagnostic.severity === "error",
  );
  const warnings = diagnostics.filter(
    (diagnostic) => diagnostic.severity === "warning",
  );
  const suggestions = diagnostics.filter(
    (diagnostic) => diagnostic.severity === "suggestion",
  );

  // Optional dev warning logging when enabled or in development environment
  if (
    options.enableDevDiagnostics ||
    (typeof process !== "undefined" &&
      process.env &&
      process.env.NODE_ENV !== "production" &&
      options.enableDevDiagnostics !== false &&
      options.context === "seo")
  ) {
    diagnostics.forEach((diag) => {
      const tagInfo = diag.source.tagName
        ? ` (tag: <${diag.source.tagName}>)`
        : "";
      const logMessage = `[react-helmet-pro:${diag.id}] ${diag.message}${tagInfo}`;
      if (diag.severity === "error") {
        console.error(logMessage);
      } else {
        console.warn(logMessage);
      }
    });
  }

  return {
    diagnostics,
    errors,
    suggestions,
    valid: errors.length === 0,
    warnings,
  };
};

/**
 * Returns whether a URL is safe for the high-level SEO helpers.
 */
export const isSafeSeoUrl = (
  value: string,
  options: { requireAbsolute?: boolean; requireHttps?: boolean } = {},
) => {
  const classified = classifyUrl(value);

  if (classified.type === "relative") {
    return !options.requireAbsolute;
  }

  if (classified.type !== "absolute") {
    return false;
  }

  return !options.requireHttps || classified.scheme === "https";
};
