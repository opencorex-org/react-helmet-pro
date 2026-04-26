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

type TagName = keyof HelmetTagCollection;

const MANAGED_ATTRIBUTE = "data-react-helmet-pro";
const CONTENT_KEY: Partial<Record<TagName, "innerHTML" | "cssText">> = {
  noscript: "innerHTML",
  script: "innerHTML",
  style: "cssText",
};

const ATTRIBUTE_NAME_MAP: Record<string, string> = {
  charSet: "charset",
  className: "class",
  crossOrigin: "crossorigin",
  httpEquiv: "http-equiv",
  itemProp: "itemprop",
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

  if (value === true) {
    element.setAttribute(attributeName, "");
    return;
  }

  element.setAttribute(attributeName, String(value));
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

const createManagedElement = (
  tagName: TagName,
  tag: BaseTag | LinkTag | MetaTag | NoscriptTag | ScriptTag | StyleTag,
) => {
  const element = document.createElement(tagName === "base" ? "base" : tagName);
  element.setAttribute(MANAGED_ATTRIBUTE, "true");

  const contentKey = CONTENT_KEY[tagName];
  if (contentKey && typeof tag[contentKey] === "string") {
    element.textContent = String(tag[contentKey]);
  }

  Object.entries(tag).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === false ||
      key === "innerHTML" ||
      key === "cssText"
    ) {
      return;
    }

    setDomAttribute(element, key, value as string | number | boolean);
  });

  return element;
};

const replaceManagedTags = (
  tagName: TagName,
  tags: Array<BaseTag | LinkTag | MetaTag | NoscriptTag | ScriptTag | StyleTag>,
) => {
  document.head
    .querySelectorAll(`${tagName}[${MANAGED_ATTRIBUTE}="true"]`)
    .forEach((node) => node.parentNode?.removeChild(node));

  tags.forEach((tag) => {
    document.head.appendChild(createManagedElement(tagName, tag));
  });
};

const syncTitle = (
  previousTitle: string | undefined,
  previousAttributes: HelmetAttributes,
  nextTitle: string | undefined,
  nextAttributes: HelmetAttributes,
) => {
  const titleElement = document.head.querySelector("title") ?? document.createElement("title");

  if (!titleElement.parentNode) {
    titleElement.setAttribute(MANAGED_ATTRIBUTE, "true");
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
    titleElement.textContent = nextTitle ?? "";
    document.title = nextTitle ?? "";
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

    removedTags[tagName] = previousTags.map((tag) => ({ ...tag })) as never;
    addedTags[tagName] = nextTags.map((tag) => ({ ...tag })) as never;
    replaceManagedTags(tagName, nextTags);
  });

  return { addedTags, removedTags };
};
