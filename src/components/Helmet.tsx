"use client";

import React, { useContext, useEffect } from "react";

import { HelmetContext } from "../context/HelmetContext";
import { updateTag } from "../core/HelmetManager";

interface HelmetProps {
  title?: string;
  meta?: { name?: string; property?: string; content: string }[];
  link?: { rel: string; href: string }[];
  script?: { src: string; async?: boolean; defer?: boolean }[];
  htmlAttributes?: { [key: string]: string };
}

export const Helmet: React.FC<HelmetProps> = ({ title, meta, link, script, htmlAttributes }) => {
  const context = useContext(HelmetContext)!;

  useEffect(() => {
    if (title) {
      document.title = title;
    }
    const tags: HTMLElement[] = [];

    meta?.forEach((m) => {
      const tag = updateTag("meta", { name: m.name, property: m.property, content: m.content });
      if (tag) tags.push(tag);
    });

    link?.forEach((l) => {
      const tag = updateTag("link", l);
      if (tag) tags.push(tag);
    });

    script?.forEach((s) => {
      const tag = updateTag("script", s);
      if (tag) tags.push(tag);
    });

    Object.entries(htmlAttributes ?? {}).forEach(([key, value]) => {
      document.documentElement.setAttribute(key, value);
    });

    return () => {
      tags.forEach((tag) => tag.remove());

      Object.keys(htmlAttributes ?? {}).forEach((key) => {
        document.documentElement.removeAttribute(key);
      });
    };
  }, [title, meta]);

  useEffect(() => {
    context?.setHead({
      title,
      meta,
      link,
      script,
      htmlAttributes
    });
  }, [title, meta, link, script, htmlAttributes, context]);

  return null;
};
