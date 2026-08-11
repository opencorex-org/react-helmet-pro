import type { HelmetAttributes } from "./tags";

export const HELMET_SECURITY_RULE_IDS = {
  BLOB_URL: "RHP_SECURITY_BLOB_URL",
  CUSTOM_URL_SCHEME: "RHP_SECURITY_CUSTOM_URL_SCHEME",
  DANGEROUS_URL_SCHEME: "RHP_SECURITY_DANGEROUS_URL_SCHEME",
  DATA_URL: "RHP_SECURITY_DATA_URL",
  DUPLICATE_RESOURCE_HINT: "RHP_SECURITY_DUPLICATE_RESOURCE_HINT",
  EVENT_HANDLER_ATTRIBUTE: "RHP_SECURITY_EVENT_HANDLER_ATTRIBUTE",
  INVALID_SRI: "RHP_SECURITY_INVALID_SRI",
  MISSING_SRI: "RHP_SECURITY_MISSING_SRI",
  PROTOCOL_RELATIVE_URL: "RHP_SECURITY_PROTOCOL_RELATIVE_URL",
  SUSPICIOUS_ATTRIBUTE_NAME: "RHP_SECURITY_SUSPICIOUS_ATTRIBUTE_NAME",
  SRI_CORS_REQUIRED: "RHP_SECURITY_SRI_CORS_REQUIRED",
  UNEXPECTED_URL_SCHEME: "RHP_SECURITY_UNEXPECTED_URL_SCHEME",
} as const;

export type HelmetSecurityRuleId =
  (typeof HELMET_SECURITY_RULE_IDS)[keyof typeof HELMET_SECURITY_RULE_IDS];

export const HELMET_SEO_RULE_IDS = {
  BASE_MULTIPLE: "RHP_SEO_BASE_MULTIPLE",
  CANONICAL_DUPLICATE: "RHP_SEO_CANONICAL_DUPLICATE",
  CANONICAL_INVALID_URL: "RHP_SEO_CANONICAL_INVALID_URL",
  CANONICAL_MISSING: "RHP_SEO_CANONICAL_MISSING",
  DATE_FUTURE: "RHP_SEO_DATE_FUTURE",
  DATE_INVALID: "RHP_SEO_DATE_INVALID",
  DATE_ORDER_INVALID: "RHP_SEO_DATE_ORDER_INVALID",
  DESCRIPTION_DUPLICATE: "RHP_SEO_DESCRIPTION_DUPLICATE",
  DESCRIPTION_EMPTY: "RHP_SEO_DESCRIPTION_EMPTY",
  DESCRIPTION_MISSING: "RHP_SEO_DESCRIPTION_MISSING",
  DESCRIPTION_TOO_LONG: "RHP_SEO_DESCRIPTION_TOO_LONG",
  DESCRIPTION_TOO_SHORT: "RHP_SEO_DESCRIPTION_TOO_SHORT",
  HREFLANG_DUPLICATE: "RHP_SEO_HREFLANG_DUPLICATE",
  HREFLANG_INVALID_CODE: "RHP_SEO_HREFLANG_INVALID_CODE",
  HREFLANG_INVALID_URL: "RHP_SEO_HREFLANG_INVALID_URL",
  HREFLANG_MISSING_X_DEFAULT: "RHP_SEO_HREFLANG_MISSING_X_DEFAULT",
  IMAGE_ALT_MISSING: "RHP_SEO_IMAGE_ALT_MISSING",
  IMAGE_INVALID_DIMENSIONS: "RHP_SEO_IMAGE_INVALID_DIMENSIONS",
  IMAGE_URL_INVALID: "RHP_SEO_IMAGE_URL_INVALID",
  GRAPH_CONFLICT: "RHP_SEO_GRAPH_CONFLICT",
  JSONLD_INVALID: "RHP_SEO_JSONLD_INVALID",
  JSONLD_MISSING_CONTEXT: "RHP_SEO_JSONLD_MISSING_CONTEXT",
  JSONLD_MISSING_TYPE: "RHP_SEO_JSONLD_MISSING_TYPE",
  NOINDEX_CANONICAL_CONFLICT: "RHP_SEO_NOINDEX_CANONICAL_CONFLICT",
  OG_CANONICAL_MISMATCH: "RHP_SEO_OG_CANONICAL_MISMATCH",
  OG_DUPLICATE: "RHP_SEO_OG_DUPLICATE",
  OG_INCOMPLETE: "RHP_SEO_OG_INCOMPLETE",
  ROBOTS_CONFLICT: "RHP_SEO_ROBOTS_CONFLICT",
  ROBOTS_DUPLICATE: "RHP_SEO_ROBOTS_DUPLICATE",
  TITLE_DUPLICATE: "RHP_SEO_TITLE_DUPLICATE",
  TITLE_EMPTY: "RHP_SEO_TITLE_EMPTY",
  TITLE_MISSING: "RHP_SEO_TITLE_MISSING",
  TITLE_TOO_LONG: "RHP_SEO_TITLE_TOO_LONG",
  TITLE_TOO_SHORT: "RHP_SEO_TITLE_TOO_SHORT",
  TWITTER_DUPLICATE: "RHP_SEO_TWITTER_DUPLICATE",
  TWITTER_INCOMPLETE: "RHP_SEO_TWITTER_INCOMPLETE",
  URL_AMBIGUOUS: "RHP_SEO_URL_AMBIGUOUS",
  PRODUCT_OFFER_MISSING_PRICE: "RHP_SEO_PRODUCT_OFFER_MISSING_PRICE",
  LOCAL_BUSINESS_MISSING_ADDRESS: "RHP_SEO_LOCAL_BUSINESS_MISSING_ADDRESS",
  VIDEO_MISSING_THUMBNAIL: "RHP_SEO_VIDEO_MISSING_THUMBNAIL",
  PAYWALL_INVALID_SELECTOR: "RHP_SEO_PAYWALL_INVALID_SELECTOR",
  PAYWALL_CLOAKING_WARNING: "RHP_SEO_PAYWALL_CLOAKING_WARNING",
} as const;

export type HelmetSeoRuleId =
  (typeof HELMET_SEO_RULE_IDS)[keyof typeof HELMET_SEO_RULE_IDS];

export const HELMET_RULE_IDS = {
  ...HELMET_SECURITY_RULE_IDS,
  ...HELMET_SEO_RULE_IDS,
} as const;

export type HelmetRuleId = HelmetSecurityRuleId | HelmetSeoRuleId;

export type HelmetDiagnosticSeverity = "error" | "warning" | "suggestion";

export type HelmetDiagnosticTagName =
  | "base"
  | "bodyAttributes"
  | "htmlAttributes"
  | "link"
  | "meta"
  | "noscript"
  | "script"
  | "style"
  | "title"
  | "titleAttributes";

export interface HelmetDiagnosticSource {
  attribute?: string;
  tag?: HelmetAttributes;
  tagIndex?: number;
  tagName: HelmetDiagnosticTagName;
}

export interface HelmetDiagnostic {
  id: HelmetRuleId;
  message: string;
  severity: HelmetDiagnosticSeverity;
  source: HelmetDiagnosticSource;
  value?: string;
}

export interface HelmetDiagnosticSuppression {
  attribute?: string;
  ruleId: HelmetRuleId;
  tagIndex?: number;
  tagName?: HelmetDiagnosticTagName;
}

export interface AuditHelmetStateOptions {
  /**
   * `raw` reflects the permissive low-level Helmet API. `seo` applies the
   * stricter URL and completeness expectations used by the high-level SEO helpers.
   */
  context?: "raw" | "seo";

  /**
   * Optional flag to log development warnings to console in non-production environment.
   */
  enableDevDiagnostics?: boolean;

  severities?: Partial<Record<HelmetRuleId, HelmetDiagnosticSeverity | "off">>;
  suppressions?: Array<HelmetRuleId | HelmetDiagnosticSuppression>;
}

export interface HelmetAuditResult {
  diagnostics: HelmetDiagnostic[];
  errors: HelmetDiagnostic[];
  suggestions: HelmetDiagnostic[];
  valid: boolean;
  warnings: HelmetDiagnostic[];
}
