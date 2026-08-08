import React from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HelmetServerContext } from "../src/types";

import {
  DnsPrefetch,
  Helmet,
  HelmetData,
  HelmetProvider,
  ModulePreload,
  Preconnect,
  Prefetch,
  Preload,
  auditHelmetState,
  buildResourceHintLink,
} from "../src";

describe("CSP Nonces, Secure Tag Placement, and Resource Hints", () => {
  describe("CSP Nonce Propagation", () => {
    it("propagates provider nonce to inline script and style tags", () => {
      const context: HelmetServerContext = {};
      const helmetData = new HelmetData(context);

      helmetData.dispatcher.setHead({
        script: [{ innerHTML: "console.log('test');" }],
        style: [{ cssText: "body { color: red; }" }],
        nonce: "provider-nonce-123",
      });

      const state = helmetData.getState();
      expect(state.nonce).toBe("provider-nonce-123");
      expect(state.script[0].nonce).toBe("provider-nonce-123");
      expect(state.style[0].nonce).toBe("provider-nonce-123");
    });

    it("ensures request-scoped isolation of nonces in SSR", () => {
      const context1: HelmetServerContext = {};
      const context2: HelmetServerContext = {};

      const req1Data = new HelmetData(context1);
      const req2Data = new HelmetData(context2);

      req1Data.dispatcher.setHead({ nonce: "nonce-req-1" });
      req2Data.dispatcher.setHead({ nonce: "nonce-req-2" });

      expect(req1Data.getState().nonce).toBe("nonce-req-1");
      expect(req2Data.getState().nonce).toBe("nonce-req-2");
    });
  });

  describe("Body Tag Placement Collections", () => {
    it("partitions scripts into head, bodyOpen, and bodyClose collections", () => {
      const context: HelmetServerContext = {};
      const helmetData = new HelmetData(context);

      helmetData.dispatcher.setHead({
        script: [
          { src: "/head-script.js", tagPosition: "head" },
          { innerHTML: "console.log('top');", tagPosition: "bodyOpen" },
          { src: "/analytics-bottom.js", tagPosition: "bodyClose" },
        ],
      });

      const serverState = helmetData.context.helmet!;
      expect(serverState.script.toString()).toContain("/head-script.js");
      expect(serverState.bodyOpenScripts.toString()).toContain("console.log(");
      expect(serverState.bodyOpenScripts.toString()).not.toContain("tag-position");
      expect(serverState.bodyCloseScripts.toString()).toContain("/analytics-bottom.js");
    });
  });

  describe("Resource Hint Components & Builders", () => {
    it("builds resource hint links with responsive image preload options", () => {
      const link = buildResourceHintLink({
        rel: "preload",
        href: "/hero.jpg",
        as: "image",
        imageSrcSet: "/hero-400.jpg 400w, /hero-800.jpg 800w",
        imageSizes: "100vw",
        fetchPriority: "high",
      });

      expect(link.rel).toBe("preload");
      expect(link.as).toBe("image");
      expect(link.imageSrcSet).toBe("/hero-400.jpg 400w, /hero-800.jpg 800w");
      expect(link.imageSizes).toBe("100vw");
      expect(link.fetchPriority).toBe("high");
    });

    it("renders Preload, Preconnect, and DnsPrefetch components into DOM", async () => {
      render(
        <HelmetProvider>
          <Preload href="/font.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
          <ModulePreload href="/app.js" />
          <Preconnect href="https://fonts.googleapis.com" crossOrigin="anonymous" />
          <DnsPrefetch href="https://cdn.example.com" />
          <Prefetch href="/next-page" />
        </HelmetProvider>,
      );

      await waitFor(() => {
        expect(document.querySelector('link[rel="preload"]')).toHaveAttribute("href", "/font.woff2");
        expect(document.querySelector('link[rel="modulepreload"]')).toHaveAttribute("href", "/app.js");
        expect(document.querySelector('link[rel="preconnect"]')).toHaveAttribute("href", "https://fonts.googleapis.com");
        expect(document.querySelector('link[rel="dns-prefetch"]')).toHaveAttribute("href", "https://cdn.example.com");
        expect(document.querySelector('link[rel="prefetch"]')).toHaveAttribute("href", "/next-page");
      });
    });
  });

  describe("Security Diagnostics (SRI & Resource Hints)", () => {
    it("diagnoses duplicate preconnect hints and missing SRI attributes", () => {
      const state = {
        base: [],
        bodyAttributes: {},
        htmlAttributes: {},
        link: [
          { href: "https://fonts.googleapis.com", rel: "preconnect" },
          { href: "https://fonts.googleapis.com", rel: "preconnect" }, // duplicate
          { crossOrigin: "anonymous", href: "https://cdn.example.com/style.css", rel: "stylesheet" }, // missing SRI
        ],
        meta: [],
        noscript: [],
        script: [
          { crossOrigin: "anonymous", src: "https://cdn.example.com/lib.js" }, // missing SRI
        ],
        style: [],
        title: "",
        titleAttributes: {},
        defer: true,
        encodeSpecialCharacters: true,
        prioritizeSeoTags: false,
      };

      const audit = auditHelmetState(state, { context: "seo" });

      const duplicateHint = audit.diagnostics.find(
        (d) => d.id === "RHP_SECURITY_DUPLICATE_RESOURCE_HINT",
      );
      expect(duplicateHint).toBeDefined();

      const missingSri = audit.diagnostics.filter(
        (d) => d.id === "RHP_SECURITY_MISSING_SRI",
      );
      expect(missingSri).toHaveLength(2);
    });
  });
});
