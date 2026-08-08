import "@testing-library/jest-dom";
import React from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";

// ─── HelmetInspector is dev-only. Mock NODE_ENV ────────────────────────────

// We set NODE_ENV to 'development' before import so the production guard doesn't throw.
// NOTE: We do NOT import from 'react-helmet-pro/inspector' subpath here (would require build),
// instead we import the source module directly.

describe("HelmetInspector (dev-only)", () => {
  let HelmetInspector: React.ComponentType<{ position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"; maxHistory?: number }>;
  let HelmetProvider: React.ComponentType<{ children: React.ReactNode }>;
  let ProductSeo: React.ComponentType<{
    title: string;
    description: string;
    images: Array<{ url: string }>;
    offers: Array<{ price: number; priceCurrency: string }>;
  }>;

  beforeEach(async () => {
    // Simulate development environment
    (process.env as Record<string, string>).NODE_ENV = "development";
    const inspectorModule = await import("../src/inspector/HelmetInspector");
    HelmetInspector = inspectorModule.HelmetInspector;

    const providerModule = await import("../src/context/HelmetProvider");
    HelmetProvider = providerModule.HelmetProvider;

    const productModule = await import("../src/components/ProductSeo");
    ProductSeo = productModule.ProductSeo;
  });

  afterEach(() => {
    cleanup();
    document.title = "";
    document.head.innerHTML = "";
    vi.resetModules();
  });

  it("renders the FAB toggle button", async () => {
    const { container } = render(
      <HelmetProvider>
        <ProductSeo
          title="Inspector Test Product"
          description="Testing inspector rendering"
          images={[{ url: "https://example.com/img.jpg" }]}
          offers={[{ price: 49.99, priceCurrency: "USD" }]}
        />
        <HelmetInspector />
      </HelmetProvider>,
    );

    await waitFor(() => {
      const btn = container.querySelector("button[aria-label='Toggle React Helmet Pro Inspector']");
      expect(btn).not.toBeNull();
    });
  });

  it("opens the inspector panel when FAB is clicked", async () => {
    const { container } = render(
      <HelmetProvider>
        <HelmetInspector />
      </HelmetProvider>,
    );

    const fab = container.querySelector("button[aria-label='Toggle React Helmet Pro Inspector']");
    expect(fab).not.toBeNull();
    fab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    // The panel dialog should appear
    await waitFor(() => {
      const panel = container.querySelector("[role='dialog']");
      expect(panel).not.toBeNull();
    });
  });

  it("renders with custom position prop", () => {
    const { container } = render(
      <HelmetProvider>
        <HelmetInspector position="top-left" />
      </HelmetProvider>,
    );

    const root = container.firstChild as HTMLElement;
    // Root element should exist
    expect(root).not.toBeNull();
  });

  it("inspector subpath index exports HelmetInspector", async () => {
    const mod = await import("../src/inspector/index");
    expect(typeof mod.HelmetInspector).toBe("function");
  });
});

describe("HelmetInspector production guard", () => {
  afterEach(() => {
    (process.env as Record<string, string>).NODE_ENV = "test";
    vi.resetModules();
  });

  it("throws when NODE_ENV is production", async () => {
    (process.env as Record<string, string>).NODE_ENV = "production";
    await expect(import("../src/inspector/HelmetInspector")).rejects.toThrow(
      /must not be imported in production/,
    );
  });
});
