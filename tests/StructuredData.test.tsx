import "@testing-library/jest-dom";

import { describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { JsonLdScript } from "../src/components/JsonLdScript";
import { StructuredData } from "../src/components/StructuredData";
import { safeJsonLdStringify } from "../src/next";

describe("StructuredData", () => {
  it("injects a JSON-LD script tag through Helmet", async () => {
    const json = { "@type": "Organization", name: "Test Org" };

    render(<StructuredData json={json} />);

    await waitFor(() => {
      expect(document.querySelector('script[type="application/ld+json"]')).toBeInTheDocument();
    });

    expect(document.querySelector('script[type="application/ld+json"]')?.textContent).toContain(
      '"name":"Test Org"',
    );
  });

  it("escapes unsafe characters in JSON-LD", () => {
    expect(safeJsonLdStringify({ html: "<script>alert(1)</script>" })).toContain("\\u003cscript>");
  });

  it("renders JsonLdScript for server-safe usage", () => {
    const markup = renderToStaticMarkup(
      <JsonLdScript data={{ "@type": "Article", headline: "Server Rendered" }} />,
    );

    expect(markup).toContain('type="application/ld+json"');
    expect(markup).toContain('"headline":"Server Rendered"');
  });
});
