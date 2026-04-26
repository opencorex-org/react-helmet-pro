"use client";

import { createContext } from "react";

import type { HelmetContextValue } from "../types";

export const HelmetContext = createContext<HelmetContextValue | null>(null);
