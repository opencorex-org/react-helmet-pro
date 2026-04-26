import React, { Children, Fragment, createElement, isValidElement } from "react";

import type {
  BaseTag,
  HelmetAttributes,
  HelmetChangeHandler,
  HelmetDescriptor,
  HelmetInstance,
  HelmetProps,
  HelmetServerAttributeAccessor,
  HelmetServerState,
  HelmetServerTagAccessor,
  HelmetState,
  HelmetTagCollection,
  LinkTag,
  MetaTag,
  NoscriptTag,
  ScriptTag,
  StyleTag,
} from "../types";

type ReducedHelmetState = {
  callbacks: HelmetChangeHandler[];
  state: HelmetState;
};

type TagEntry<T> = {
  dedupeKey: string;
  tag: T;
};

const PRIORITY_META_NAMES = new Set([
  "description",
  "twitter:description",
  "twitter:title",
]);

const PRIORITY_META_PROPERTIES = new Set([
  "og:description",
  "og:image",
  "og:title",
  "twitter:description",
  "twitter:image",
  "twitter:title",
]);

const PRIORITY_SCRIPT_TYPES = new Set(["application/ld+json"]);

const SELF_CLOSING_TAGS = new Set(["base", "link", "meta"]);

const ATTRIBUTE_NAME_MAP: Record<string, string> = {
  charSet: "charset",
  className: "class",
  crossOrigin: "crossorigin",
  httpEquiv: "http-equiv",
  itemProp: "itemprop",
};

export const createEmptyTagCollection = (): HelmetTagCollection => ({
  base: [],
  link: [],
  meta: [],
  noscript: [],
  script: [],
  style: [],
});

export const createEmptyState = (): HelmetState => ({
  ...createEmptyTagCollection(),
  bodyAttributes: {},
  defer: true,
  encodeSpecialCharacters: true,
  htmlAttributes: {},
  prioritizeSeoTags: false,
  titleAttributes: {},
});

const copyAttributes = (attributes?: HelmetAttributes): HelmetAttributes => {
  const next: HelmetAttributes = {};

  Object.entries(attributes ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) {
      return;
    }

    next[key] = value;
  });

  return next;
};

const copyTag = <T extends HelmetAttributes>(tag: T): T => copyAttributes(tag) as T;

const copyTags = <T extends HelmetAttributes>(tags?: T[]): T[] => (tags ?? []).map(copyTag);

const omitKeys = <T extends Record<string, unknown>>(value: T, keys: string[]): Partial<T> => {
  const next: Partial<T> = {};

  Object.entries(value).forEach(([key, entryValue]) => {
    if (keys.includes(key) || entryValue === undefined || entryValue === null || entryValue === false) {
      return;
    }

    next[key as keyof T] = entryValue as T[keyof T];
  });

  return next;
};

const extractText = (value: unknown): string => {
  if (value === undefined || value === null || typeof value === "boolean") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(extractText).join("");
  }

  if (isValidElement(value)) {
    return extractText((value.props as { children?: unknown }).children);
  }

  return "";
};

const normalizeScriptChild = (props: Record<string, unknown>): ScriptTag => {
  const tag = omitKeys(props, ["children", "dangerouslySetInnerHTML"]) as ScriptTag;
  const innerHTML = (props.dangerouslySetInnerHTML as { __html?: string } | undefined)?.__html;

  if (typeof innerHTML === "string") {
    tag.innerHTML = innerHTML;
  } else if (props.children !== undefined) {
    tag.innerHTML = extractText(props.children);
  }

  return copyTag(tag);
};

const normalizeStyleChild = (props: Record<string, unknown>): StyleTag => {
  const tag = omitKeys(props, ["children", "dangerouslySetInnerHTML"]) as StyleTag;
  const innerHTML = (props.dangerouslySetInnerHTML as { __html?: string } | undefined)?.__html;

  if (typeof innerHTML === "string") {
    tag.cssText = innerHTML;
  } else if (props.children !== undefined) {
    tag.cssText = extractText(props.children);
  }

  return copyTag(tag);
};

const normalizeNoscriptChild = (props: Record<string, unknown>): NoscriptTag => {
  const tag = omitKeys(props, ["children", "dangerouslySetInnerHTML"]) as NoscriptTag;
  const innerHTML = (props.dangerouslySetInnerHTML as { __html?: string } | undefined)?.__html;

  if (typeof innerHTML === "string") {
    tag.innerHTML = innerHTML;
  } else if (props.children !== undefined) {
    tag.innerHTML = extractText(props.children);
  }

  return copyTag(tag);
};

const mergeAttributes = (current: HelmetAttributes, next?: HelmetAttributes): HelmetAttributes => ({
  ...current,
  ...copyAttributes(next),
});

const parseChildrenIntoDescriptor = (children: React.ReactNode, descriptor: HelmetDescriptor) => {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    if (child.type === Fragment) {
      parseChildrenIntoDescriptor((child.props as { children?: React.ReactNode }).children, descriptor);
      return;
    }

    if (typeof child.type !== "string") {
      return;
    }

    const tagName = child.type.toLowerCase();
    const props = (child.props ?? {}) as Record<string, unknown>;

    switch (tagName) {
      case "html":
        descriptor.htmlAttributes = mergeAttributes(
          descriptor.htmlAttributes,
          omitKeys(props, ["children"]) as HelmetAttributes,
        );
        break;
      case "body":
        descriptor.bodyAttributes = mergeAttributes(
          descriptor.bodyAttributes,
          omitKeys(props, ["children"]) as HelmetAttributes,
        );
        break;
      case "title":
        descriptor.title = extractText(props.children);
        descriptor.titleAttributes = mergeAttributes(
          descriptor.titleAttributes,
          omitKeys(props, ["children"]) as HelmetAttributes,
        );
        break;
      case "base":
        descriptor.base = [copyTag(omitKeys(props, ["children"]) as BaseTag)];
        break;
      case "meta":
        descriptor.meta.push(copyTag(omitKeys(props, ["children"]) as MetaTag));
        break;
      case "link":
        descriptor.link.push(copyTag(omitKeys(props, ["children"]) as LinkTag));
        break;
      case "script":
        descriptor.script.push(normalizeScriptChild(props));
        break;
      case "style":
        descriptor.style.push(normalizeStyleChild(props));
        break;
      case "noscript":
        descriptor.noscript.push(normalizeNoscriptChild(props));
        break;
      default:
        break;
    }
  });
};

export const normalizeHelmetProps = (props: Partial<HelmetProps> = {}): HelmetDescriptor => {
  const descriptor: HelmetDescriptor = {
    base: props.base ? [copyTag(props.base)] : [],
    bodyAttributes: copyAttributes(props.bodyAttributes),
    defaultTitle: props.defaultTitle,
    defer: props.defer ?? true,
    encodeSpecialCharacters: props.encodeSpecialCharacters ?? true,
    htmlAttributes: copyAttributes(props.htmlAttributes),
    link: copyTags(props.link),
    meta: copyTags(props.meta),
    noscript: copyTags(props.noscript),
    onChangeClientState: props.onChangeClientState,
    prioritizeSeoTags: props.prioritizeSeoTags ?? false,
    script: copyTags(props.script),
    style: copyTags(props.style),
    title: props.title,
    titleAttributes: copyAttributes(props.titleAttributes),
    titleTemplate: props.titleTemplate,
  };

  if (props.children) {
    parseChildrenIntoDescriptor(props.children, descriptor);
  }

  return descriptor;
};

const getMetaDedupeKey = (tag: MetaTag): string => {
  if (tag.charSet) {
    return "meta:charset";
  }

  if (tag.name) {
    return `meta:name:${tag.name}`;
  }

  if (tag.property) {
    return `meta:property:${tag.property}`;
  }

  if (tag.httpEquiv) {
    return `meta:httpEquiv:${tag.httpEquiv}`;
  }

  if (tag.itemProp) {
    return `meta:itemProp:${tag.itemProp}`;
  }

  return `meta:${JSON.stringify(tag)}`;
};

const getLinkDedupeKey = (tag: LinkTag): string => {
  const rel = tag.rel ?? "";

  if (rel === "canonical") {
    return "link:canonical";
  }

  if (rel === "alternate" && tag.hrefLang) {
    return `link:alternate:${tag.hrefLang}`;
  }

  if (rel && tag.sizes) {
    return `link:${rel}:${tag.sizes}`;
  }

  if (rel && tag.media) {
    return `link:${rel}:${tag.media}`;
  }

  if (rel && tag.href) {
    return `link:${rel}:${tag.href}`;
  }

  return `link:${JSON.stringify(tag)}`;
};

const getScriptDedupeKey = (tag: ScriptTag): string =>
  tag.src ? `script:src:${tag.src}` : `script:inline:${tag.type ?? "text/javascript"}:${tag.innerHTML ?? ""}`;

const getStyleDedupeKey = (tag: StyleTag): string =>
  `style:${tag.media ?? "all"}:${tag.cssText ?? ""}`;

const getNoscriptDedupeKey = (tag: NoscriptTag): string => `noscript:${tag.innerHTML ?? ""}`;

const getBaseDedupeKey = (tag: BaseTag): string =>
  `base:${tag.href ?? ""}:${tag.target ?? ""}`;

const mergeTagEntries = <T>(
  current: TagEntry<T>[],
  next: T[],
  getDedupeKey: (tag: T) => string,
): TagEntry<T>[] => {
  if (!next.length) {
    return current;
  }

  const keys = new Set(next.map(getDedupeKey));
  const withoutDuplicates = current.filter((entry) => !keys.has(entry.dedupeKey));

  next.forEach((tag) => {
    withoutDuplicates.push({
      dedupeKey: getDedupeKey(tag),
      tag,
    });
  });

  return withoutDuplicates;
};

const applyTitleTemplate = (title: string | undefined, titleTemplate?: string, defaultTitle?: string) => {
  if (!title) {
    return defaultTitle;
  }

  if (!titleTemplate) {
    return title;
  }

  return titleTemplate.includes("%s") ? titleTemplate.replace(/%s/g, title) : `${titleTemplate}${title}`;
};

export const reduceHelmetInstances = (instances: Iterable<HelmetInstance>): ReducedHelmetState => {
  const ordered = Array.from(instances).sort((left, right) => left.order - right.order);
  const callbacks: HelmetChangeHandler[] = [];

  let bodyAttributes: HelmetAttributes = {};
  let htmlAttributes: HelmetAttributes = {};
  let titleAttributes: HelmetAttributes = {};
  let title: string | undefined;
  let titleTemplate: string | undefined;
  let defaultTitle: string | undefined;
  let defer = true;
  let encodeSpecialCharacters = true;
  let prioritizeSeoTags = false;
  let base: TagEntry<BaseTag>[] = [];
  let meta: TagEntry<MetaTag>[] = [];
  let link: TagEntry<LinkTag>[] = [];
  let script: TagEntry<ScriptTag>[] = [];
  let style: TagEntry<StyleTag>[] = [];
  let noscript: TagEntry<NoscriptTag>[] = [];

  ordered.forEach(({ data }) => {
    bodyAttributes = mergeAttributes(bodyAttributes, data.bodyAttributes);
    htmlAttributes = mergeAttributes(htmlAttributes, data.htmlAttributes);
    titleAttributes = mergeAttributes(titleAttributes, data.titleAttributes);

    if (data.title !== undefined) {
      title = data.title;
    }

    if (data.titleTemplate !== undefined) {
      titleTemplate = data.titleTemplate;
    }

    if (data.defaultTitle !== undefined) {
      defaultTitle = data.defaultTitle;
    }

    defer = data.defer;
    encodeSpecialCharacters = data.encodeSpecialCharacters;
    prioritizeSeoTags = prioritizeSeoTags || data.prioritizeSeoTags;
    base = mergeTagEntries(base, data.base, getBaseDedupeKey);
    meta = mergeTagEntries(meta, data.meta, getMetaDedupeKey);
    link = mergeTagEntries(link, data.link, getLinkDedupeKey);
    script = mergeTagEntries(script, data.script, getScriptDedupeKey);
    style = mergeTagEntries(style, data.style, getStyleDedupeKey);
    noscript = mergeTagEntries(noscript, data.noscript, getNoscriptDedupeKey);

    if (data.onChangeClientState) {
      callbacks.push(data.onChangeClientState);
    }
  });

  return {
    callbacks,
    state: {
      base: base.map((entry) => entry.tag),
      bodyAttributes,
      defaultTitle,
      defer,
      encodeSpecialCharacters,
      htmlAttributes,
      link: link.map((entry) => entry.tag),
      meta: meta.map((entry) => entry.tag),
      noscript: noscript.map((entry) => entry.tag),
      prioritizeSeoTags,
      script: script.map((entry) => entry.tag),
      style: style.map((entry) => entry.tag),
      title: applyTitleTemplate(title, titleTemplate, defaultTitle),
      titleAttributes,
      titleTemplate,
    },
  };
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

const getAttributeName = (name: string) =>
  ATTRIBUTE_NAME_MAP[name] ?? name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);

export const serializeAttributes = (
  attributes: HelmetAttributes,
  encodeSpecialCharacters = true,
): string =>
  Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => {
      const attributeName = getAttributeName(key);

      if (value === true) {
        return attributeName;
      }

      const stringValue = String(value);
      return `${attributeName}="${encodeSpecialCharacters ? escapeHtml(stringValue) : stringValue}"`;
    })
    .join(" ");

const serializeContent = (value: string, encodeSpecialCharacters: boolean) =>
  encodeSpecialCharacters ? escapeHtml(value) : value;

const createTagComponent = (
  tagName: string,
  attributes: HelmetAttributes,
  index: number,
  contentKey?: "innerHTML" | "cssText",
) => {
  const props: Record<string, unknown> = {
    ...attributes,
    key: `${tagName}-${index}`,
  };

  if (contentKey === "innerHTML" && typeof attributes.innerHTML === "string") {
    delete props.innerHTML;
    props.dangerouslySetInnerHTML = { __html: attributes.innerHTML };
    return createElement(tagName, props);
  }

  if (contentKey === "cssText" && typeof attributes.cssText === "string") {
    const cssText = attributes.cssText;
    delete props.cssText;
    return createElement(tagName, props, cssText);
  }

  return createElement(tagName, props);
};

const serializeTag = (
  tagName: string,
  attributes: HelmetAttributes,
  encodeSpecialCharacters: boolean,
  contentKey?: "innerHTML" | "cssText",
): string => {
  const content = contentKey ? attributes[contentKey] : undefined;
  const filteredAttributes = omitKeys(attributes, [contentKey ?? "__none__"]) as HelmetAttributes;
  const serializedAttributes = serializeAttributes(filteredAttributes, encodeSpecialCharacters);
  const attributePrefix = serializedAttributes ? ` ${serializedAttributes}` : "";

  if (SELF_CLOSING_TAGS.has(tagName)) {
    return `<${tagName}${attributePrefix} />`;
  }

  const normalizedContent =
    typeof content === "string" ? serializeContent(content, encodeSpecialCharacters) : "";

  return `<${tagName}${attributePrefix}>${normalizedContent}</${tagName}>`;
};

const createListAccessor = <T extends HelmetAttributes>(
  tagName: string,
  tags: T[],
  encodeSpecialCharacters: boolean,
  contentKey?: "innerHTML" | "cssText",
): HelmetServerTagAccessor<T> => ({
  toComponent: () => {
    if (!tags.length) {
      return null;
    }

    return tags.map((tag, index) => createTagComponent(tagName, tag, index, contentKey));
  },
  toString: () => tags.map((tag) => serializeTag(tagName, tag, encodeSpecialCharacters, contentKey)).join(""),
});

const createTitleAccessor = (
  title: string | undefined,
  attributes: HelmetAttributes,
  encodeSpecialCharacters: boolean,
): HelmetServerTagAccessor<{ attributes?: HelmetAttributes; title: string }> => ({
  toComponent: () => {
    if (!title) {
      return null;
    }

    return createElement("title", { ...attributes }, title);
  },
  toString: () => {
    if (!title) {
      return "";
    }

    const serializedAttributes = serializeAttributes(attributes, encodeSpecialCharacters);
    const attributePrefix = serializedAttributes ? ` ${serializedAttributes}` : "";
    return `<title${attributePrefix}>${serializeContent(title, encodeSpecialCharacters)}</title>`;
  },
});

const createAttributeAccessor = (
  attributes: HelmetAttributes,
  encodeSpecialCharacters: boolean,
): HelmetServerAttributeAccessor => ({
  toComponent: () => ({ ...attributes }),
  toString: () => serializeAttributes(attributes, encodeSpecialCharacters),
});

const isPriorityMetaTag = (tag: MetaTag) =>
  (typeof tag.name === "string" && PRIORITY_META_NAMES.has(tag.name)) ||
  (typeof tag.property === "string" && PRIORITY_META_PROPERTIES.has(tag.property));

const isPriorityLinkTag = (tag: LinkTag) => tag.rel === "canonical";

const isPriorityScriptTag = (tag: ScriptTag) =>
  typeof tag.type === "string" && PRIORITY_SCRIPT_TYPES.has(tag.type);

const splitPriorityTags = (state: HelmetState) => {
  if (!state.prioritizeSeoTags) {
    return {
      link: state.link,
      meta: state.meta,
      priority: [] as Array<MetaTag | LinkTag | ScriptTag>,
      script: state.script,
    };
  }

  const priorityMeta = state.meta.filter(isPriorityMetaTag);
  const priorityLink = state.link.filter(isPriorityLinkTag);
  const priorityScript = state.script.filter(isPriorityScriptTag);

  return {
    link: state.link.filter((tag) => !isPriorityLinkTag(tag)),
    meta: state.meta.filter((tag) => !isPriorityMetaTag(tag)),
    priority: [...priorityMeta, ...priorityLink, ...priorityScript],
    script: state.script.filter((tag) => !isPriorityScriptTag(tag)),
  };
};

const createPriorityAccessor = (
  tags: Array<MetaTag | LinkTag | ScriptTag>,
  encodeSpecialCharacters: boolean,
): HelmetServerTagAccessor<MetaTag | LinkTag | ScriptTag> => ({
  toComponent: () => {
    if (!tags.length) {
      return null;
    }

    return tags.map((tag, index) => {
      if ("rel" in tag || "href" in tag) {
        return createTagComponent("link", tag, index);
      }

      if ("src" in tag || "innerHTML" in tag) {
        return createTagComponent("script", tag, index, "innerHTML");
      }

      return createTagComponent("meta", tag, index);
    });
  },
  toString: () =>
    tags
      .map((tag) => {
        if ("rel" in tag || "href" in tag) {
          return serializeTag("link", tag, encodeSpecialCharacters);
        }

        if ("src" in tag || "innerHTML" in tag) {
          return serializeTag("script", tag, encodeSpecialCharacters, "innerHTML");
        }

        return serializeTag("meta", tag, encodeSpecialCharacters);
      })
      .join(""),
});

export const buildServerState = (state: HelmetState): HelmetServerState => {
  const { link, meta, priority, script } = splitPriorityTags(state);

  return {
    base: createListAccessor("base", state.base, state.encodeSpecialCharacters),
    bodyAttributes: createAttributeAccessor(state.bodyAttributes, state.encodeSpecialCharacters),
    htmlAttributes: createAttributeAccessor(state.htmlAttributes, state.encodeSpecialCharacters),
    link: createListAccessor("link", link, state.encodeSpecialCharacters),
    meta: createListAccessor("meta", meta, state.encodeSpecialCharacters),
    noscript: createListAccessor("noscript", state.noscript, state.encodeSpecialCharacters, "innerHTML"),
    priority: createPriorityAccessor(priority, state.encodeSpecialCharacters),
    script: createListAccessor("script", script, state.encodeSpecialCharacters, "innerHTML"),
    style: createListAccessor("style", state.style, state.encodeSpecialCharacters, "cssText"),
    title: createTitleAccessor(state.title, state.titleAttributes, state.encodeSpecialCharacters),
  };
};
