import React from "react";

import { safeJsonLdStringify } from "../next";

interface JsonLdScriptProps extends Omit<React.ScriptHTMLAttributes<HTMLScriptElement>, "children"> {
  data: unknown;
}

export const JsonLdScript = ({ data, type, ...props }: JsonLdScriptProps) => (
  <script
    {...props}
    type={type ?? "application/ld+json"}
    dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(data) }}
  />
);
