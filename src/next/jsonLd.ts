export const safeJsonLdStringify = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c");
