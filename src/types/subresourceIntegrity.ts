export type SriAlgorithm = "sha256" | "sha384" | "sha512";
/** One or more whitespace-separated SRI hash expressions. */
export type SubresourceIntegrity = `${SriAlgorithm}-${string}`;
export type CrossOriginPolicy = "" | "anonymous" | "use-credentials";
export type ReferrerPolicy =
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url";

export interface ExternalScriptOptions {
  async?: boolean;
  /** Defaults to "anonymous", which enables cross-origin SRI without credentials. */
  crossOrigin?: Exclude<CrossOriginPolicy, "">;
  defer?: boolean;
  fetchPriority?: string;
  integrity: SubresourceIntegrity;
  nonce?: string;
  /** Defaults to "no-referrer". */
  referrerPolicy?: ReferrerPolicy;
  src: string;
  tagPosition?: "head" | "bodyOpen" | "bodyClose";
  type?: string;
}

export interface ExternalStylesheetOptions {
  /** Defaults to "anonymous", which enables cross-origin SRI without credentials. */
  crossOrigin?: Exclude<CrossOriginPolicy, "">;
  fetchPriority?: string;
  href: string;
  integrity: SubresourceIntegrity;
  media?: string;
  nonce?: string;
  /** Defaults to "no-referrer". */
  referrerPolicy?: ReferrerPolicy;
  type?: string;
}

export type ExternalScriptProps = ExternalScriptOptions;
export type ExternalStylesheetProps = ExternalStylesheetOptions;

export interface IntegrityValidationResult {
  algorithms: SriAlgorithm[];
  error?: string;
  valid: boolean;
}
