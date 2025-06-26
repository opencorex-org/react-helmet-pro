"use client";

import { useEffect } from "react";

interface FaviconProps {
  href: string;
  type?: string;
  sizes?: string;
}

export const Favicon = ({ href, type, sizes }: FaviconProps) => {
  useEffect(() => {
    const existingIcons = document.querySelectorAll("link[rel='icon']");
    existingIcons.forEach((icon) => document.head.removeChild(icon));

    const link = document.createElement("link");
    link.rel = "icon";
    link.href = href;
    if (type) link.type = type;
    if (sizes) link.sizes = sizes;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };

  }, [href, type, sizes]);

  return null;
};