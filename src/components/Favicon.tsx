"use client";

import { isSafeSeoUrl } from "../core/auditHelmetState";
import { Helmet } from "./Helmet";

interface FaviconProps {
  href: string;
  type?: string;
  sizes?: string;
}

export const Favicon = ({ href, type, sizes }: FaviconProps) => {
  if (!isSafeSeoUrl(href)) {
    return null;
  }

  return <Helmet link={[{ href, rel: "icon", sizes, type }]} />;
};
