import type {} from "vitest";

// Vitest Matcher Types Augmentation
declare module "vitest" {
  interface Assertion<T = any> {
    toHaveCanonical(expectedHref: string): void;
    toBeIndexable(): void;
    toHaveHreflang(language: string, expectedHref?: string): void;
    toHaveValidStructuredData(expectedType?: string, expectedSchema?: any): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveCanonical(expectedHref: string): any;
    toBeIndexable(): any;
    toHaveHreflang(language: string, expectedHref?: string): any;
    toHaveValidStructuredData(expectedType?: string, expectedSchema?: any): any;
  }
}

export * from "./index";
