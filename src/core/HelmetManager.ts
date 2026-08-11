import type {
  BaseTag,
  HelmetAttributes,
  HelmetState,
  HelmetTagCollection,
  LinkTag,
  MetaTag,
  NoscriptTag,
  ScriptTag,
  StyleTag,
} from "../types";
import {
  HELMET_IDENTITY_ATTRIBUTE,
  HELMET_MANAGED_ATTRIBUTE,
  toHelmetDomIdentity,
} from "./helmetDom";
import { getTagIdentityKey } from "./helmetState";

type TagName = keyof HelmetTagCollection;
type ManagedTag = BaseTag | LinkTag | MetaTag | NoscriptTag | ScriptTag | StyleTag;

const CONTENT_KEY: Partial<Record<TagName, "innerHTML" | "cssText">> = {
  noscript: "innerHTML",
  script: "innerHTML",
  style: "cssText",
};

const ATTRIBUTE_NAME_MAP: Record<string, string> = {
  charSet: "charset",
  className: "class",
  crossOrigin: "crossorigin",
  hrefLang: "hreflang",
  httpEquiv: "http-equiv",
  itemProp: "itemprop",
  referrerPolicy: "referrerpolicy",
};

const getAttributeName = (name: string) =>
  ATTRIBUTE_NAME_MAP[name] ?? name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);

const cloneCollection = (collection: HelmetTagCollection): HelmetTagCollection => ({
  base: collection.base.map((tag) => ({ ...tag })),
  link: collection.link.map((tag) => ({ ...tag })),
  meta: collection.meta.map((tag) => ({ ...tag })),
  noscript: collection.noscript.map((tag) => ({ ...tag })),
  script: collection.script.map((tag) => ({ ...tag })),
  style: collection.style.map((tag) => ({ ...tag })),
});

const setDomAttribute = (element: HTMLElement, key: string, value: string | number | boolean) => {
  const attributeName = getAttributeName(key);
  const attributeValue = value === true ? "" : String(value);

  if (element.getAttribute(attributeName) === attributeValue) {
    return;
  }

  element.setAttribute(attributeName, attributeValue);
};

export const updateTag = (type: string, props: Record<string, unknown>): HTMLElement => {
  const tag = document.createElement(type);

  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) {
      return;
    }

    if (key === "children" || key === "innerHTML" || key === "cssText") {
      tag.textContent = String(value);
      return;
    }

    setDomAttribute(tag, key, value as string | number | boolean);
  });

  document.head.appendChild(tag);
  return tag;
};

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const objectValue = value as Record<string, unknown>;
  const keys = Object.keys(objectValue).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`).join(",")}}`;
};

const collectionsMatch = <T>(left: T[], right: T[]) => stableStringify(left) === stableStringify(right);

const syncAttributes = (
  element: HTMLElement,
  previous: HelmetAttributes,
  next: HelmetAttributes,
) => {
  Object.keys(previous).forEach((key) => {
    if (!(key in next)) {
      element.removeAttribute(getAttributeName(key));
    }
  });

  Object.entries(next).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) {
      element.removeAttribute(getAttributeName(key));
      return;
    }

    setDomAttribute(element, key, value);
  });
};

const createManagedElement = (tagName: TagName) =>
  document.createElement(tagName === "base" ? "base" : tagName);

const syncManagedElement = (
  element: HTMLElement,
  tagName: TagName,
  tag: ManagedTag,
) => {
  const desiredAttributes = new Map<string, string>();
  desiredAttributes.set(HELMET_MANAGED_ATTRIBUTE, "true");
  desiredAttributes.set(
    HELMET_IDENTITY_ATTRIBUTE,
    toHelmetDomIdentity(getTagIdentityKey(tagName, tag)),
  );

  Object.entries(tag).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === false ||
      key === "key" ||
      key === "innerHTML" ||
      key === "cssText" ||
      key === "tagPosition" ||
      key === "tag-position"
    ) {
      return;
    }

    desiredAttributes.set(getAttributeName(key), value === true ? "" : String(value));
  });

  Array.from(element.attributes).forEach((attribute) => {
    if (!desiredAttributes.has(attribute.name)) {
      element.removeAttribute(attribute.name);
    }
  });

  desiredAttributes.forEach((value, name) => {
    if (element.getAttribute(name) !== value) {
      element.setAttribute(name, value);
    }
  });

  const contentKey = CONTENT_KEY[tagName];
  const nextContent = contentKey && typeof tag[contentKey] === "string"
    ? String(tag[contentKey])
    : "";
  if (element.textContent !== nextContent) {
    element.textContent = nextContent;
  }
};

const getManagedElements = (tagName: TagName): HTMLElement[] =>
  Array.from(
    document.head.querySelectorAll<HTMLElement>(
      `${tagName}[${HELMET_MANAGED_ATTRIBUTE}="true"]`,
    ),
  );

const reconcileManagedTags = (
  tagName: TagName,
  tags: ManagedTag[],
) => {
  const existing = getManagedElements(tagName);
  const groupEnd = existing.length ? existing[existing.length - 1].nextSibling : null;
  const elementsByIdentity = new Map<string, HTMLElement[]>();

  existing.forEach((element) => {
    const identity = element.getAttribute(HELMET_IDENTITY_ATTRIBUTE);
    if (!identity) {
      return;
    }
    const matches = elementsByIdentity.get(identity) ?? [];
    matches.push(element);
    elementsByIdentity.set(identity, matches);
  });

  const desired = tags.map((tag) => {
    const identity = toHelmetDomIdentity(getTagIdentityKey(tagName, tag));
    const matches = elementsByIdentity.get(identity);
    const element = matches?.shift() ?? createManagedElement(tagName);
    syncManagedElement(element, tagName, tag);
    return element;
  });

  const desiredSet = new Set(desired);
  existing.forEach((element) => {
    if (!desiredSet.has(element)) {
      element.parentNode?.removeChild(element);
    }
  });

  const current = existing.filter((element) => desiredSet.has(element));
  desired.forEach((element, index) => {
    const reference = current[index] ?? groupEnd;
    if (reference !== element) {
      document.head.insertBefore(element, reference);
      const previousIndex = current.indexOf(element, index + 1);
      if (previousIndex !== -1) {
        current.splice(previousIndex, 1);
      }
      current.splice(index, 0, element);
    }
  });
};

const diffTags = (
  tagName: TagName,
  previous: ManagedTag[],
  next: ManagedTag[],
) => {
  const previousByIdentity = new Map(
    previous.map((tag) => [getTagIdentityKey(tagName, tag), tag]),
  );
  const nextByIdentity = new Map(
    next.map((tag) => [getTagIdentityKey(tagName, tag), tag]),
  );
  const added: ManagedTag[] = [];
  const removed: ManagedTag[] = [];

  previousByIdentity.forEach((tag, identity) => {
    const nextTag = nextByIdentity.get(identity);
    if (!nextTag || stableStringify(tag) !== stableStringify(nextTag)) {
      removed.push({ ...tag });
    }
  });
  nextByIdentity.forEach((tag, identity) => {
    const previousTag = previousByIdentity.get(identity);
    if (!previousTag || stableStringify(previousTag) !== stableStringify(tag)) {
      added.push({ ...tag });
    }
  });

  return { added, removed };
};

const syncTitle = (
  previousTitle: string | undefined,
  previousAttributes: HelmetAttributes,
  nextTitle: string | undefined,
  nextAttributes: HelmetAttributes,
) => {
  const titleElement = document.head.querySelector("title") ?? document.createElement("title");

  if (!titleElement.parentNode) {
    titleElement.setAttribute(HELMET_MANAGED_ATTRIBUTE, "true");
    document.head.appendChild(titleElement);
  }

  Object.keys(previousAttributes).forEach((key) => {
    if (!(key in nextAttributes)) {
      titleElement.removeAttribute(getAttributeName(key));
    }
  });

  Object.entries(nextAttributes).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) {
      titleElement.removeAttribute(getAttributeName(key));
      return;
    }

    setDomAttribute(titleElement, key, value);
  });

  if (previousTitle !== nextTitle) {
    const nextText = nextTitle ?? "";
    if (titleElement.textContent !== nextText) {
      titleElement.textContent = nextText;
      document.title = nextText;
    }
  }
};

export const syncHelmetState = (
  previous: HelmetState,
  next: HelmetState,
): {
  addedTags: HelmetTagCollection;
  removedTags: HelmetTagCollection;
} => {
  syncAttributes(document.documentElement, previous.htmlAttributes, next.htmlAttributes);
  syncAttributes(document.body, previous.bodyAttributes, next.bodyAttributes);
  syncTitle(previous.title, previous.titleAttributes, next.title, next.titleAttributes);

  const addedTags: HelmetTagCollection = cloneCollection({
    base: [],
    link: [],
    meta: [],
    noscript: [],
    script: [],
    style: [],
  });
  const removedTags: HelmetTagCollection = cloneCollection({
    base: [],
    link: [],
    meta: [],
    noscript: [],
    script: [],
    style: [],
  });

  (["base", "link", "meta", "noscript", "script", "style"] as TagName[]).forEach((tagName) => {
    const previousTags = previous[tagName];
    const nextTags = next[tagName];

    if (collectionsMatch(previousTags, nextTags)) {
      return;
    }

    const diff = diffTags(tagName, previousTags, nextTags);
    removedTags[tagName] = diff.removed as never;
    addedTags[tagName] = diff.added as never;
    reconcileManagedTags(tagName, nextTags);
  });

  return { addedTags, removedTags };
};
