"use client";

import { updateTag } from "../core/HelmetManager";
import { useEffect } from "react";

export const SecurityMeta = () => {
  const securityMetaTags = [
    {
      name: "referrer",
      content: "no-referrer",
    },
  ];

  useEffect(() => {
    const createdTags: HTMLElement[] = [];

    securityMetaTags.forEach((tagProps) => {
      const tag = updateTag("meta", tagProps);
      if (tag) createdTags.push(tag);
    });

    return () => {
      createdTags.forEach((tag) => tag.remove());
    };
  }, []);

  return null;
};
