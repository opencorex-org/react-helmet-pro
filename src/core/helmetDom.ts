export const HELMET_MANAGED_ATTRIBUTE = "data-react-helmet-pro";
export const HELMET_IDENTITY_ATTRIBUTE = "data-react-helmet-pro-key";

// Keep SSR ownership metadata compact even when an identity contains inline
// script or style content. State-level deduplication still uses the full key.
export const toHelmetDomIdentity = (identity: string): string => {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;

  for (let index = 0; index < identity.length; index += 1) {
    const code = identity.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ code, 0x85ebca6b);
  }

  return `${(first >>> 0).toString(36)}-${(second >>> 0).toString(36)}`;
};
