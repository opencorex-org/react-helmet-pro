import "@testing-library/jest-dom";

import React from "react";
import { renderToString } from "react-dom/server";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StructuredDataGraph } from "../src/components/StructuredDataGraph";
import { HelmetProvider } from "../src/context/HelmetProvider";
import { auditHelmetState } from "../src/core/auditHelmetState";
import type { HelmetServerContext } from "../src/types";
import {
  createEntityRef,
  createJsonLdGraph,
  JsonLdGraph,
} from "../src/utils/jsonLdGraph";
import { buildOrganizationSchema, buildWebSiteSchema } from "../src/utils/schemaBuilder";

describe("JSON-LD graph composition, entity registry, and deduplication", () => {
  afterEach(() => {
    cleanup();
    HelmetProvider.canUseDOM = true;
    document.title = "";
    document.head.innerHTML = "";
  });

  describe("JsonLdGraph Engine", () => {
    it("deduplicates and deep-merges entities sharing the same @id", () => {
      const graph = createJsonLdGraph();

      graph.addEntity({
        "@id": "https://example.com/#organization",
        "@type": "Organization",
        name: "Acme Corp",
        url: "https://example.com",
      });

      graph.addEntity({
        "@id": "https://example.com/#organization",
        "@type": "Organization",
        logo: "https://example.com/logo.png",
        sameAs: ["https://twitter.com/acme"],
      });

      const output = graph.toGraphObject();

      expect(output).toEqual({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@id": "https://example.com/#organization",
            "@type": "Organization",
            logo: "https://example.com/logo.png",
            name: "Acme Corp",
            sameAs: ["https://twitter.com/acme"],
            url: "https://example.com",
          },
        ],
      });
    });

    it("registers conflict diagnostic warnings when @type mismatches for the same @id", () => {
      const graph = createJsonLdGraph();

      graph.addEntity({
        "@id": "https://example.com/#entity",
        "@type": "Organization",
        name: "Acme Org",
      });

      graph.addEntity({
        "@id": "https://example.com/#entity",
        "@type": "Person",
        name: "John Doe",
      });

      const conflicts = graph.getConflicts();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].id).toBe("https://example.com/#entity");
      expect(conflicts[0].existingType).toBe("Organization");
      expect(conflicts[0].newType).toBe("Person");
    });

    it("handles circular references safely without infinite recursion during serialization", () => {
      const graph = createJsonLdGraph();

      const org: Record<string, unknown> = {
        "@id": "https://example.com/#org",
        "@type": "Organization",
        name: "Acme",
      };

      const founder: Record<string, unknown> = {
        "@id": "https://example.com/#person",
        "@type": "Person",
        name: "Founder",
        worksFor: org,
      };

      // Create circular reference
      org.founder = founder;

      graph.addEntity(org);
      graph.addEntity(founder);

      const output = graph.toGraphObject();
      expect(output["@graph"]).toHaveLength(2);
      const firstNode = output["@graph"][0] as Record<string, Record<string, Record<string, unknown>>>;
      expect(firstNode.founder.worksFor.founder).toEqual({
        "@id": "https://example.com/#person",
      });
    });

    it("sorts entities deterministically by @id for byte-identical output", () => {
      const graphA = createJsonLdGraph([
        { "@id": "https://example.com/#website", "@type": "WebSite", name: "Site" },
        { "@id": "https://example.com/#org", "@type": "Organization", name: "Org" },
      ]);

      const graphB = createJsonLdGraph([
        { "@id": "https://example.com/#org", "@type": "Organization", name: "Org" },
        { "@id": "https://example.com/#website", "@type": "WebSite", name: "Site" },
      ]);

      expect(JSON.stringify(graphA.toGraphObject())).toBe(
        JSON.stringify(graphB.toGraphObject()),
      );
    });
  });

  describe("StructuredDataGraph Component & Hydration", () => {
    it("renders @graph JSON-LD script into DOM with stable element ID", async () => {
      const orgSchema = buildOrganizationSchema({
        name: "Acme Global",
        url: "https://example.com",
      });

      const siteSchema = buildWebSiteSchema({
        name: "Acme Platform",
        url: "https://example.com",
      });

      render(
        <HelmetProvider>
          <StructuredDataGraph
            entities={[
              { ...orgSchema, "@id": "https://example.com/#org" },
              { ...siteSchema, "@id": "https://example.com/#website" },
            ]}
          />
        </HelmetProvider>,
      );

      await waitFor(() => {
        const script = document.getElementById("rhp-jsonld-graph");
        expect(script).toBeInTheDocument();
        expect(script).toHaveAttribute("type", "application/ld+json");

        const parsed = JSON.parse(script?.innerHTML ?? "{}");
        expect(parsed["@context"]).toBe("https://schema.org");
        expect(parsed["@graph"]).toHaveLength(2);
      });
    });

    it("audits graph conflicts in auditHelmetState", () => {
      const state = {
        base: [],
        bodyAttributes: {},
        htmlAttributes: {},
        link: [],
        meta: [],
        noscript: [],
        script: [
          {
            innerHTML: JSON.stringify({
              "@graph": [
                { "@id": "https://example.com/#item", "@type": "Product", name: "P1" },
                { "@id": "https://example.com/#item", "@type": "Event", name: "E1" },
              ],
            }),
            type: "application/ld+json",
          },
        ],
        style: [],
        title: "",
        titleAttributes: {},
        defer: false,
        encodeSpecialCharacters: true,
        prioritizeSeoTags: false,
      };

      const audit = auditHelmetState(state, { context: "seo" });
      const conflictDiagnostic = audit.diagnostics.find(
        (d) => d.id === "RHP_SEO_GRAPH_CONFLICT",
      );

      expect(conflictDiagnostic).toBeDefined();
      expect(conflictDiagnostic?.value).toBe("https://example.com/#item");
    });
  });
});
