"use client";

import React from "react";

import { safeJsonLdStringify } from "../next";
import type { HelmetAttributes, LinkTag, MetaTag, ScriptTag } from "../types";
import { Helmet } from "./Helmet";

export interface SeoAlternateLink {
  href: string;
  hrefLang?: string;
  media?: string;
  title?: string;
  type?: string;
}

export interface SeoImage {
  alt?: string;
  height?: number;
  secureUrl?: string;
  type?: string;
  url: string;
  width?: number;
}

export interface SeoOpenGraph {
  alternateLocale?: string[];
  authors?: string[];
  description?: string;
  determiner?: string;
  expirationTime?: string;
  images?: SeoImage[];
  locale?: string;
  modifiedTime?: string;
  publishedTime?: string;
  section?: string;
  siteName?: string;
  tags?: string[];
  title?: string;
  type?: string;
  url?: string;
}

export interface SeoTwitter {
  card?: "app" | "player" | "summary" | "summary_large_image";
  creator?: string;
  description?: string;
  imageAlt?: string;
  images?: string[];
  site?: string;
  title?: string;
}

export interface SeoVerification {
  google?: string;
  msvalidate?: string;
  other?: Array<{
    content: string;
    name: string;
  }>;
  yahoo?: string;
  yandex?: string;
}

export interface SeoRobotsRules {
  follow?: boolean;
  index?: boolean;
  /** Only takes effect together with `index: false`. */
  indexIfEmbedded?: boolean;
  maxImagePreview?: "large" | "none" | "standard";
  maxSnippet?: number;
  maxVideoPreview?: number;
  noarchive?: boolean;
  nocache?: boolean;
  noimageindex?: boolean;
  nosnippet?: boolean;
  notranslate?: boolean;
  unavailableAfter?: string;
}

export interface SeoRobotsDirectives extends SeoRobotsRules {
  /** Rules specifically for Google's text search crawler. */
  googleBot?: SeoRobotsRules;
  /** Rules specifically for Google News. */
  googleBotNews?: SeoRobotsRules;
}

export interface SeoProps {
  alternates?: SeoAlternateLink[];
  author?: string;
  canonical?: string;
  defaultTitle?: string;
  description?: string;
  extraLink?: LinkTag[];
  extraMeta?: MetaTag[];
  htmlAttributes?: HelmetAttributes;
  jsonLd?: object | object[];
  keywords?: string[];
  locale?: string;
  openGraph?: SeoOpenGraph;
  robots?: SeoRobotsDirectives;
  siteName?: string;
  title?: string;
  titleTemplate?: string;
  twitter?: SeoTwitter;
  verification?: SeoVerification;
  /** Places critical SEO tags in Helmet's priority SSR output. */
  prioritizeSeoTags?: boolean;
}

const appendPropertyMeta = (list: MetaTag[], property: string, content?: string | number) => {
  if (content === undefined || content === null || content === "") {
    return;
  }

  list.push({
    content: String(content),
    property,
  });
};

const appendNameMeta = (list: MetaTag[], name: string, content?: string | number) => {
  if (content === undefined || content === null || content === "") {
    return;
  }

  list.push({
    content: String(content),
    name,
  });
};

const buildRobotsContent = (value?: SeoRobotsRules) => {
  if (!value) {
    return undefined;
  }

  const parts: string[] = [];

  if (value.index !== undefined) {
    parts.push(value.index ? "index" : "noindex");
  }

  if (value.follow !== undefined) {
    parts.push(value.follow ? "follow" : "nofollow");
  }

  if (value.indexIfEmbedded) {
    parts.push("indexifembedded");
  }

  if (value.noarchive) {
    parts.push("noarchive");
  }

  if (value.nocache) {
    parts.push("nocache");
  }

  if (value.noimageindex) {
    parts.push("noimageindex");
  }

  if (value.nosnippet) {
    parts.push("nosnippet");
  }

  if (value.notranslate) {
    parts.push("notranslate");
  }

  if (value.maxImagePreview) {
    parts.push(`max-image-preview:${value.maxImagePreview}`);
  }

  if (value.maxSnippet !== undefined) {
    parts.push(`max-snippet:${value.maxSnippet}`);
  }

  if (value.maxVideoPreview !== undefined) {
    parts.push(`max-video-preview:${value.maxVideoPreview}`);
  }

  if (value.unavailableAfter) {
    parts.push(`unavailable_after:${value.unavailableAfter}`);
  }

  return parts.length ? parts.join(", ") : undefined;
};

const buildJsonLdScripts = (value?: object | object[]): ScriptTag[] => {
  if (!value) {
    return [];
  }

  const entries = Array.isArray(value) ? value : [value];

  return entries.map((entry, index) => ({
    id: entries.length > 1 ? `seo-jsonld-${index + 1}` : "seo-jsonld",
    innerHTML: safeJsonLdStringify(entry),
    type: "application/ld+json",
  }));
};

export const Seo = ({
  alternates,
  author,
  canonical,
  defaultTitle,
  description,
  extraLink,
  extraMeta,
  htmlAttributes,
  jsonLd,
  keywords,
  locale,
  openGraph,
  prioritizeSeoTags,
  robots,
  siteName,
  title,
  titleTemplate,
  twitter,
  verification,
}: SeoProps) => {
  const meta: MetaTag[] = [];
  const link: LinkTag[] = [];

  appendNameMeta(meta, "description", description);
  appendNameMeta(meta, "keywords", keywords?.join(", "));
  appendNameMeta(meta, "author", author);

  const robotsContent = buildRobotsContent(robots);
  const googleBotContent = buildRobotsContent(robots?.googleBot);
  const googleBotNewsContent = buildRobotsContent(robots?.googleBotNews);

  appendNameMeta(meta, "robots", robotsContent);
  appendNameMeta(meta, "googlebot", googleBotContent);
  appendNameMeta(meta, "googlebot-news", googleBotNewsContent);

  appendNameMeta(meta, "google-site-verification", verification?.google);
  appendNameMeta(meta, "yandex-verification", verification?.yandex);
  appendNameMeta(meta, "y_key", verification?.yahoo);
  appendNameMeta(meta, "msvalidate.01", verification?.msvalidate);
  verification?.other?.forEach((entry) => appendNameMeta(meta, entry.name, entry.content));

  if (canonical) {
    link.push({
      href: canonical,
      rel: "canonical",
    });
  }

  alternates?.forEach((entry) => {
    link.push({
      href: entry.href,
      hrefLang: entry.hrefLang,
      media: entry.media,
      rel: "alternate",
      title: entry.title,
      type: entry.type,
    });
  });

  const resolvedOpenGraph = openGraph
    ? {
        ...openGraph,
        description: openGraph.description ?? description,
        locale: openGraph.locale ?? locale,
        siteName: openGraph.siteName ?? siteName,
        title: openGraph.title ?? title,
        type: openGraph.type ?? "website",
        url: openGraph.url ?? canonical,
      }
    : undefined;

  appendPropertyMeta(meta, "og:type", resolvedOpenGraph?.type);
  appendPropertyMeta(meta, "og:url", resolvedOpenGraph?.url);
  appendPropertyMeta(meta, "og:title", resolvedOpenGraph?.title);
  appendPropertyMeta(meta, "og:description", resolvedOpenGraph?.description);
  appendPropertyMeta(meta, "og:site_name", resolvedOpenGraph?.siteName);
  appendPropertyMeta(meta, "og:locale", resolvedOpenGraph?.locale);
  appendPropertyMeta(meta, "og:determiner", resolvedOpenGraph?.determiner);
  resolvedOpenGraph?.alternateLocale?.forEach((entry) =>
    appendPropertyMeta(meta, "og:locale:alternate", entry),
  );

  resolvedOpenGraph?.images?.forEach((image) => {
    appendPropertyMeta(meta, "og:image", image.url);
    appendPropertyMeta(meta, "og:image:secure_url", image.secureUrl);
    appendPropertyMeta(meta, "og:image:alt", image.alt);
    appendPropertyMeta(meta, "og:image:type", image.type);
    appendPropertyMeta(meta, "og:image:width", image.width);
    appendPropertyMeta(meta, "og:image:height", image.height);
  });

  if (resolvedOpenGraph?.type === "article") {
    appendPropertyMeta(meta, "article:published_time", resolvedOpenGraph.publishedTime);
    appendPropertyMeta(meta, "article:modified_time", resolvedOpenGraph.modifiedTime);
    appendPropertyMeta(meta, "article:expiration_time", resolvedOpenGraph.expirationTime);
    appendPropertyMeta(meta, "article:section", resolvedOpenGraph.section);
    resolvedOpenGraph.authors?.forEach((entry) => appendPropertyMeta(meta, "article:author", entry));
    resolvedOpenGraph.tags?.forEach((entry) => appendPropertyMeta(meta, "article:tag", entry));
  }

  const resolvedTwitter = twitter
    ? {
        ...twitter,
        card: twitter.card ?? "summary_large_image",
        description: twitter.description ?? description,
        title: twitter.title ?? title,
      }
    : undefined;

  appendNameMeta(meta, "twitter:card", resolvedTwitter?.card);
  appendNameMeta(meta, "twitter:site", resolvedTwitter?.site);
  appendNameMeta(meta, "twitter:creator", resolvedTwitter?.creator);
  appendNameMeta(meta, "twitter:title", resolvedTwitter?.title);
  appendNameMeta(meta, "twitter:description", resolvedTwitter?.description);
  resolvedTwitter?.images?.forEach((entry) => appendNameMeta(meta, "twitter:image", entry));
  appendNameMeta(meta, "twitter:image:alt", resolvedTwitter?.imageAlt);

  meta.push(...(extraMeta ?? []));
  link.push(...(extraLink ?? []));

  const resolvedHtmlAttributes: HelmetAttributes = {
    ...(htmlAttributes ?? {}),
    ...(locale && !htmlAttributes?.lang ? { lang: locale } : {}),
  };

  return (
    <Helmet
      defaultTitle={defaultTitle}
      htmlAttributes={resolvedHtmlAttributes}
      link={link}
      meta={meta}
      prioritizeSeoTags={prioritizeSeoTags}
      script={buildJsonLdScripts(jsonLd)}
      title={title}
      titleTemplate={titleTemplate}
    />
  );
};
