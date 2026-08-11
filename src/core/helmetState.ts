import React, { Children, Fragment, createElement, isValidElement } from "react";

import {
  HELMET_IDENTITY_ATTRIBUTE,
  HELMET_MANAGED_ATTRIBUTE,
  toHelmetDomIdentity,
} from "./helmetDom";

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
import {
  INLINE_CONTENT_KEYS,
  resolveInlineContent,
  serializeInlineContent,
  type InlineTagName,
} from "./inlineContent";

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
  hrefLang: "hreflang",
  httpEquiv: "http-equiv",
  itemProp: "itemprop",
  referrerPolicy: "referrerpolicy",
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
    const rawProps = (child.props ?? {}) as Record<string, unknown>;
    const elementKey =
      child.key && !String(child.key).startsWith(".")
        ? String(child.key)
        : undefined;
    const props = elementKey
      ? { key: elementKey, ...rawProps }
      : rawProps;

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
    nonce: props.nonce,
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

export const REPEATABLE_META_PROPERTIES = new Set([
  "og:image",
  "og:image:url",
  "og:image:secure_url",
  "og:image:alt",
  "og:image:type",
  "og:image:width",
  "og:image:height",
  "article:author",
  "article:tag",
  "og:see_also",
  "music:musician",
  "video:actor",
  "video:director",
  "video:tag",
]);

export const getTagIdentityKey = (
  tagName: string,
  attributes: HelmetAttributes = {},
): string => {
  const normTag = tagName.toLowerCase();

  if (attributes.key) {
    return `${normTag}:key:${attributes.key}`;
  }

  if (normTag === "meta") {
    if (attributes.charSet) {
      return "meta:charset";
    }

    if (attributes.name) {
      return `meta:name:${String(attributes.name).toLowerCase()}`;
    }

    if (attributes.property) {
      const prop = String(attributes.property).toLowerCase();
      if (REPEATABLE_META_PROPERTIES.has(prop)) {
        return `meta:property:${prop}:${String(attributes.content ?? "")}`;
      }
      return `meta:property:${prop}`;
    }

    if (attributes.httpEquiv) {
      return `meta:httpEquiv:${String(attributes.httpEquiv).toLowerCase()}`;
    }

    if (attributes.itemProp) {
      return `meta:itemProp:${String(attributes.itemProp).toLowerCase()}`;
    }

    return `meta:${JSON.stringify(attributes)}`;
  }

  if (normTag === "link") {
    const rel = String(attributes.rel ?? "").toLowerCase();

    if (rel === "canonical") {
      return "link:canonical";
    }

    if (rel === "alternate" && attributes.hrefLang) {
      return `link:alternate:lang:${String(attributes.hrefLang).toLowerCase()}`;
    }

    if (rel === "alternate" && attributes.media) {
      return `link:alternate:media:${attributes.media}`;
    }

    if (rel === "icon" && attributes.sizes) {
      return `link:icon:${attributes.sizes}:${attributes.href ?? ""}`;
    }

    if (rel === "stylesheet" && attributes.href) {
      return `link:stylesheet:${attributes.href}`;
    }

    if (rel && attributes.href) {
      return `link:${rel}:${attributes.href}`;
    }

    return `link:${JSON.stringify(attributes)}`;
  }

  if (normTag === "script") {
    if (attributes.src) {
      return `script:src:${attributes.src}`;
    }
    return `script:inline:${attributes.type ?? "text/javascript"}:${resolveInlineContent("script", attributes)?.value ?? ""}`;
  }

  if (normTag === "style") {
    return `style:${attributes.media ?? "all"}:${resolveInlineContent("style", attributes)?.value ?? ""}`;
  }

  if (normTag === "noscript") {
    return `noscript:${resolveInlineContent("noscript", attributes)?.value ?? ""}`;
  }

  if (normTag === "base") {
    return `base:${attributes.href ?? ""}:${attributes.target ?? ""}`;
  }

  return `${normTag}:${JSON.stringify(attributes)}`;
};

const getMetaDedupeKey = (tag: MetaTag): string => getTagIdentityKey("meta", tag);

const getLinkDedupeKey = (tag: LinkTag): string => getTagIdentityKey("link", tag);

const getScriptDedupeKey = (tag: ScriptTag): string => getTagIdentityKey("script", tag);

const getStyleDedupeKey = (tag: StyleTag): string => getTagIdentityKey("style", tag);

const getNoscriptDedupeKey = (tag: NoscriptTag): string => getTagIdentityKey("noscript", tag);

const getBaseDedupeKey = (tag: BaseTag): string => getTagIdentityKey("base", tag);

const mergeTagEntries = <T>(
  current: TagEntry<T>[],
  next: T[],
  getDedupeKey: (tag: T) => string,
): TagEntry<T>[] => {
  if (!next.length) {
    return current;
  }

  const nextDeduplicatedMap = new Map<string, T>();
  next.forEach((tag) => {
    nextDeduplicatedMap.set(getDedupeKey(tag), tag);
  });

  const nextKeys = new Set(nextDeduplicatedMap.keys());
  const withoutDuplicates = current.filter((entry) => !nextKeys.has(entry.dedupeKey));

  nextDeduplicatedMap.forEach((tag, key) => {
    withoutDuplicates.push({
      dedupeKey: key,
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

  let nonce: string | undefined;

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

    if (data.nonce !== undefined) {
      nonce = data.nonce;
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

  const allScripts = script.map((entry) => {
    const s = { ...entry.tag };
    if (nonce && !s.nonce && (resolveInlineContent("script", s) || s.type === "application/ld+json")) {
      s.nonce = nonce;
    }
    return s;
  });

  const allStyles = style.map((entry) => {
    const st = { ...entry.tag };
    if (nonce && !st.nonce) {
      st.nonce = nonce;
    }
    return st;
  });

  const headScripts = allScripts.filter(
    (s) => !s.tagPosition || s.tagPosition === "head",
  );
  const bodyOpenScripts = allScripts.filter((s) => s.tagPosition === "bodyOpen");
  const bodyCloseScripts = allScripts.filter((s) => s.tagPosition === "bodyClose");

  return {
    callbacks,
    state: {
      base: base.map((entry) => entry.tag),
      bodyAttributes,
      bodyCloseScripts,
      bodyOpenScripts,
      defaultTitle,
      defer,
      encodeSpecialCharacters,
      htmlAttributes,
      link: link.map((entry) => entry.tag),
      meta: meta.map((entry) => entry.tag),
      nonce,
      noscript: noscript.map((entry) => entry.tag),
      prioritizeSeoTags,
      script: headScripts,
      style: allStyles,
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

const createTagComponent = (
  tagName: string,
  attributes: HelmetAttributes,
  index: number,
  _contentKey?: "innerHTML" | "cssText",
) => {
  const identity = getTagIdentityKey(tagName, attributes);
  const props: Record<string, unknown> = {
    ...attributes,
    [HELMET_MANAGED_ATTRIBUTE]: "true",
    [HELMET_IDENTITY_ATTRIBUTE]: toHelmetDomIdentity(identity),
    key: attributes.key ?? `${identity}-${index}`,
  };
  delete props.tagPosition;
  delete props["tag-position"];

  INLINE_CONTENT_KEYS.forEach((key) => delete props[key]);
  if (tagName === "script" || tagName === "style" || tagName === "noscript") {
    const content = resolveInlineContent(tagName, attributes);
    if (content) {
      props.dangerouslySetInnerHTML = {
        __html: serializeInlineContent(content.kind, content.value),
      };
    }
  }

  return createElement(tagName, props);
};

const serializeTag = (
  tagName: string,
  attributes: HelmetAttributes,
  encodeSpecialCharacters: boolean,
  _contentKey?: "innerHTML" | "cssText",
): string => {
  const filteredAttributes = omitKeys(attributes, [
    ...INLINE_CONTENT_KEYS,
    "key",
    "tagPosition",
    "tag-position",
  ]) as HelmetAttributes;
  const serializedAttributes = serializeAttributes(
    {
      ...filteredAttributes,
      [HELMET_MANAGED_ATTRIBUTE]: "true",
      [HELMET_IDENTITY_ATTRIBUTE]: toHelmetDomIdentity(
        getTagIdentityKey(tagName, attributes),
      ),
    },
    encodeSpecialCharacters,
  );
  const attributePrefix = serializedAttributes ? ` ${serializedAttributes}` : "";

  if (SELF_CLOSING_TAGS.has(tagName)) {
    return `<${tagName}${attributePrefix} />`;
  }

  const content =
    tagName === "script" || tagName === "style" || tagName === "noscript"
      ? resolveInlineContent(tagName as InlineTagName, attributes)
      : undefined;
  const normalizedContent = content ? serializeInlineContent(content.kind, content.value) : "";

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
    return `<title${attributePrefix}>${escapeHtml(title)}</title>`;
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

      if ("src" in tag || resolveInlineContent("script", tag)) {
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

        if ("src" in tag || resolveInlineContent("script", tag)) {
          return serializeTag("script", tag, encodeSpecialCharacters, "innerHTML");
        }

        return serializeTag("meta", tag, encodeSpecialCharacters);
      })
      .join(""),
});

export const buildServerState = (state: HelmetState): HelmetServerState => {
  const { link, meta, priority, script } = splitPriorityTags(state);
  // The legacy opt-out remains in state for compatibility, but no longer disables
  // contextual escaping in server output.
  const encodeSpecialCharacters = true;

  return {
    base: createListAccessor("base", state.base, encodeSpecialCharacters),
    bodyAttributes: createAttributeAccessor(state.bodyAttributes, encodeSpecialCharacters),
    bodyCloseScripts: createListAccessor("script", state.bodyCloseScripts ?? [], encodeSpecialCharacters, "innerHTML"),
    bodyOpenScripts: createListAccessor("script", state.bodyOpenScripts ?? [], encodeSpecialCharacters, "innerHTML"),
    htmlAttributes: createAttributeAccessor(state.htmlAttributes, encodeSpecialCharacters),
    link: createListAccessor("link", link, encodeSpecialCharacters),
    meta: createListAccessor("meta", meta, encodeSpecialCharacters),
    noscript: createListAccessor("noscript", state.noscript, encodeSpecialCharacters, "innerHTML"),
    priority: createPriorityAccessor(priority, encodeSpecialCharacters),
    script: createListAccessor("script", script, encodeSpecialCharacters, "innerHTML"),
    style: createListAccessor("style", state.style, encodeSpecialCharacters, "cssText"),
    title: createTitleAccessor(state.title, state.titleAttributes, encodeSpecialCharacters),
  };
};
