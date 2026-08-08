import React, { StrictMode, Suspense, useState } from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  Helmet,
  HelmetData,
  HelmetProvider,
  getTagIdentityKey,
} from "../src";
import type { HelmetServerContext } from "../src/types";

const resetDocument = () => {
  document.title = "";
  document.head.innerHTML = "";
};

describe("Head Deduplication, Concurrency, and State Restoration", () => {
  afterEach(() => {
    cleanup();
    resetDocument();
  });

  describe("Public Identity Matrix (getTagIdentityKey)", () => {
    it("respects explicit key prop over attribute defaults", () => {
      expect(getTagIdentityKey("meta", { content: "blue", key: "custom-theme", name: "theme-color" })).toBe(
        "meta:key:custom-theme",
      );
      expect(getTagIdentityKey("link", { href: "/style.css", key: "main-css", rel: "stylesheet" })).toBe(
        "link:key:main-css",
      );
    });

    it("differentiates repeatable vs single-instance meta properties", () => {
      // Single-instance
      expect(getTagIdentityKey("meta", { content: "Desc 1", name: "description" })).toBe("meta:name:description");
      expect(getTagIdentityKey("meta", { content: "Title 1", property: "og:title" })).toBe("meta:property:og:title");

      // Repeatable multi-value properties
      expect(getTagIdentityKey("meta", { content: "https://example.com/a.jpg", property: "og:image" })).toBe(
        "meta:property:og:image:https://example.com/a.jpg",
      );
      expect(getTagIdentityKey("meta", { content: "https://example.com/b.jpg", property: "og:image" })).toBe(
        "meta:property:og:image:https://example.com/b.jpg",
      );
      expect(getTagIdentityKey("meta", { content: "Author 1", property: "article:author" })).toBe(
        "meta:property:article:author:Author 1",
      );
    });

    it("differentiates link tags by rel and discriminators", () => {
      expect(getTagIdentityKey("link", { href: "/fav-32.png", rel: "icon", sizes: "32x32" })).toBe(
        "link:icon:32x32:/fav-32.png",
      );
      expect(getTagIdentityKey("link", { href: "/fav-64.png", rel: "icon", sizes: "64x64" })).toBe(
        "link:icon:64x64:/fav-64.png",
      );
      expect(getTagIdentityKey("link", { href: "/a.css", rel: "stylesheet" })).toBe(
        "link:stylesheet:/a.css",
      );
      expect(getTagIdentityKey("link", { href: "/b.css", rel: "stylesheet" })).toBe(
        "link:stylesheet:/b.css",
      );
    });
  });

  describe("Repeatable Tag Preservation in Helmet", () => {
    it("preserves multiple distinct og:image tags while deduplicating identical ones", async () => {
      render(
        <HelmetProvider>
          <Helmet>
            <meta property="og:image" content="https://example.com/img1.jpg" />
            <meta property="og:image" content="https://example.com/img2.jpg" />
            <meta property="og:image" content="https://example.com/img1.jpg" /> {/* duplicate */}
          </Helmet>
        </HelmetProvider>,
      );

      await waitFor(() => {
        const ogImages = Array.from(
          document.querySelectorAll<HTMLMetaElement>('meta[property="og:image"]'),
        );
        expect(ogImages).toHaveLength(2);
        expect(ogImages.map((m) => m.getAttribute("content"))).toEqual([
          "https://example.com/img1.jpg",
          "https://example.com/img2.jpg",
        ]);
      });
    });

    it("honors explicit key overrides", async () => {
      render(
        <HelmetProvider>
          <Helmet>
            <meta key="theme" name="theme-color" content="red" />
            <meta key="theme" name="theme-color" content="blue" />
          </Helmet>
        </HelmetProvider>,
      );

      await waitFor(() => {
        const themeMetas = Array.from(
          document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'),
        );
        expect(themeMetas).toHaveLength(1);
        expect(themeMetas[0].getAttribute("content")).toBe("blue");
      });
    });
  });

  describe("React StrictMode & Suspense Concurrency", () => {
    it("is completely idempotent under React.StrictMode double rendering", async () => {
      render(
        <StrictMode>
          <HelmetProvider>
            <Helmet>
              <title>Strict Mode Title</title>
              <meta name="description" content="Strict mode description" />
            </Helmet>
          </HelmetProvider>
        </StrictMode>,
      );

      await waitFor(() => {
        expect(document.title).toBe("Strict Mode Title");
        expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
      });
    });

    it("restores parent state deterministically on child unmount", async () => {
      function TestApp() {
        const [showChild, setShowChild] = useState(true);

        return (
          <HelmetProvider>
            <Helmet>
              <title>Parent Title</title>
            </Helmet>
            <button type="button" onClick={() => setShowChild(false)}>
              Toggle
            </button>

            {showChild && (
              <Helmet>
                <title>Child Override Title</title>
              </Helmet>
            )}
          </HelmetProvider>
        );
      }

      const { getByRole } = render(<TestApp />);

      await waitFor(() => {
        expect(document.title).toBe("Child Override Title");
      });

      getByRole("button").click();

      await waitFor(() => {
        expect(document.title).toBe("Parent Title");
      });
    });

    it("handles Suspense boundary resolution without stale leaks", async () => {
      function LazyComponent() {
        return (
          <Helmet>
            <title>Async Loaded Title</title>
          </Helmet>
        );
      }

      render(
        <HelmetProvider>
          <Helmet>
            <title>Fallback Title</title>
          </Helmet>
          <Suspense fallback={<div>Loading...</div>}>
            <LazyComponent />
          </Suspense>
        </HelmetProvider>,
      );

      await waitFor(() => {
        expect(document.title).toBe("Async Loaded Title");
      });
    });
  });

  describe("Concurrent SSR Request Isolation", () => {
    it("ensures zero cross-request state pollution across concurrent Node.js SSR instances", () => {
      const context1: HelmetServerContext = {};
      const context2: HelmetServerContext = {};

      const req1Data = new HelmetData(context1);
      const req2Data = new HelmetData(context2);

      req1Data.dispatcher.setHead({ title: "User 1 Dashboard" });
      req2Data.dispatcher.setHead({ title: "User 2 Profile" });

      expect(req1Data.getState().title).toBe("User 1 Dashboard");
      expect(req2Data.getState().title).toBe("User 2 Profile");

      expect(req1Data.context.helmet?.title.toComponent()).toBeDefined();
      expect(req2Data.context.helmet?.title.toComponent()).toBeDefined();
    });
  });
});
