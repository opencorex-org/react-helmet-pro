"use client";

import { createContext } from "react";

export interface HelmetContextType {
  setHead: (data: {
    title?: string;
    meta?: { name?: string; property?: string; content: string }[];
    link?: { rel: string; href: string }[];
    script?: { src: string; async?: boolean; defer?: boolean }[];
    htmlAttributes?: { [key: string]: string };
  }) => void;
  title?: string;
  meta?: { name?: string; property?: string; content: string }[];
  link?: { rel: string; href: string }[];
  script?: { src: string; async?: boolean; defer?: boolean }[];
  htmlAttributes?: { [key: string]: string };
}

export const HelmetContext = createContext<HelmetContextType | null>(null);