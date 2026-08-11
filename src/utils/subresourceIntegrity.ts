import type {
  ExternalScriptOptions,
  ExternalStylesheetOptions,
  IntegrityValidationResult,
  SriAlgorithm,
  SubresourceIntegrity,
} from "../types/subresourceIntegrity";
import type { LinkTag, ScriptTag } from "../types/tags";

export const DEFAULT_SRI_CROSS_ORIGIN = "anonymous" as const;
export const DEFAULT_SRI_REFERRER_POLICY = "no-referrer" as const;

const DIGEST_BYTES: Record<SriAlgorithm, number> = {
  sha256: 32,
  sha384: 48,
  sha512: 64,
};

const HASH_EXPRESSION_PATTERN = /^(sha256|sha384|sha512)-([A-Za-z0-9+/]+={0,2})(?:\?[^\s]+)?$/;

const getDecodedByteLength = (base64: string): number | null => {
  const withoutPadding = base64.replace(/=+$/, "");
  if (withoutPadding.length % 4 === 1) {
    return null;
  }

  return Math.floor((withoutPadding.length * 6) / 8);
};

export const validateIntegrity = (integrity: string): IntegrityValidationResult => {
  const expressions = integrity.trim().split(/\s+/).filter(Boolean);
  const algorithms: SriAlgorithm[] = [];

  if (!expressions.length) {
    return {
      algorithms,
      error: "Integrity metadata must contain at least one hash.",
      valid: false,
    };
  }

  for (const expression of expressions) {
    const match = expression.match(HASH_EXPRESSION_PATTERN);
    if (!match) {
      return {
        algorithms,
        error: `Invalid integrity hash expression "${expression}".`,
        valid: false,
      };
    }

    const algorithm = match[1] as SriAlgorithm;
    const digest = match[2];
    if (getDecodedByteLength(digest) !== DIGEST_BYTES[algorithm]) {
      return {
        algorithms,
        error: `The ${algorithm} digest has an invalid encoded length.`,
        valid: false,
      };
    }

    if (!algorithms.includes(algorithm)) {
      algorithms.push(algorithm);
    }
  }

  return { algorithms, valid: true };
};

export const isValidIntegrity = (integrity: string): integrity is SubresourceIntegrity =>
  validateIntegrity(integrity).valid;

export const buildExternalScript = (options: ExternalScriptOptions): ScriptTag => ({
  ...options,
  crossOrigin: options.crossOrigin ?? DEFAULT_SRI_CROSS_ORIGIN,
  referrerPolicy: options.referrerPolicy ?? DEFAULT_SRI_REFERRER_POLICY,
});

export const buildExternalStylesheet = (
  options: ExternalStylesheetOptions,
): LinkTag => ({
  ...options,
  crossOrigin: options.crossOrigin ?? DEFAULT_SRI_CROSS_ORIGIN,
  referrerPolicy: options.referrerPolicy ?? DEFAULT_SRI_REFERRER_POLICY,
  rel: "stylesheet",
});
