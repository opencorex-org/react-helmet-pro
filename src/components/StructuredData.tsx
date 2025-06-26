"use client";

import { useEffect } from "react";

interface StructuredDataProps {
  json: object;
}

export const StructuredData = ({ json }: StructuredDataProps) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.innerHTML = JSON.stringify(json);

    script.setAttribute("data-structured", "true");

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [json]);

  return null;
};