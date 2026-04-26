"use client";

import { Helmet } from "./Helmet";
import { safeJsonLdStringify } from "../next";

interface StructuredDataProps {
  id?: string;
  json: object;
}

export const StructuredData = ({ id, json }: StructuredDataProps) => (
  <Helmet
    script={[
      {
        id,
        innerHTML: safeJsonLdStringify(json),
        type: "application/ld+json",
      },
    ]}
  />
);
