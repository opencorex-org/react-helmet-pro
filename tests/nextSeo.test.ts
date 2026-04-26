import { describe, expect, it } from "vitest";

import {
  buildNextManifest,
  buildNextMetadata,
  buildNextRobots,
  buildNextSitemap,
  buildNextViewport,
} from "../src/next";

describe("Next.js SEO helpers", () => {
  it("builds metadata with common SEO fields", () => {
    const metadata = buildNextMetadata({
      absoluteTitle: "Absolute Product Title",
      alternates: {
        canonical: "https://acme.com/products/widget",
        languages: {
          de: "https://acme.com/de/products/widget",
          en: "https://acme.com/products/widget",
        },
      },
      appLinks: {
        ios: [{ appName: "Acme", url: "acme://products/widget" }],
      },
      appleWebApp: {
        capable: true,
        startupImage: [{ media: "(device-width: 768px)", url: "/apple-startup.png" }],
        title: "Acme",
      },
      authors: ["Acme Team", { name: "Lahiru", url: "https://acme.com/team/lahiru" }],
      category: "technology",
      classification: "software",
      creator: "Acme",
      description: "A product detail page",
      formatDetection: { email: false, telephone: false },
      icons: {
        apple: ["/apple-icon.png"],
        icon: ["/icon.png", { sizes: "any", type: "image/svg+xml", url: "/icon.svg" }],
      },
      keywords: ["acme", "widget", "seo"],
      manifest: "/manifest.webmanifest",
      metadataBase: "https://acme.com",
      openGraph: {
        description: "Open Graph description",
        images: [
          "/og/widget.png",
          { alt: "Widget image", height: 630, url: "https://cdn.acme.com/widget.png", width: 1200 },
        ],
        siteName: "Acme",
        title: "Widget",
        type: "website",
        url: "https://acme.com/products/widget",
      },
      other: {
        "fb:app_id": "123456789",
      },
      publisher: "Acme Inc.",
      referrer: "origin-when-cross-origin",
      robots: {
        follow: true,
        googleBot: {
          "max-image-preview": "large",
          index: true,
        },
        index: true,
      },
      twitter: {
        card: "summary_large_image",
        creator: "@acme",
        images: ["/twitter/widget.png"],
        title: "Widget",
      },
      verification: {
        google: "google-token",
        me: ["mailto:hello@acme.com"],
      },
    });

    expect(metadata.metadataBase?.toString()).toBe("https://acme.com/");
    expect(metadata.title).toEqual({ absolute: "Absolute Product Title" });
    expect(metadata.alternates?.canonical).toBe("https://acme.com/products/widget");
    expect(metadata.authors?.[0]).toEqual({ name: "Acme Team" });
    expect(metadata.icons?.icon?.[1]).toEqual({
      sizes: "any",
      type: "image/svg+xml",
      url: "/icon.svg",
    });
    expect(metadata.openGraph?.images?.[1]).toEqual({
      alt: "Widget image",
      height: 630,
      url: "https://cdn.acme.com/widget.png",
      width: 1200,
    });
    expect(metadata.twitter?.images?.[0]).toBe("/twitter/widget.png");
    expect(metadata.robots?.googleBot).toEqual({
      "max-image-preview": "large",
      index: true,
    });
    expect(metadata.verification?.me).toEqual(["mailto:hello@acme.com"]);
  });

  it("builds viewport metadata", () => {
    const viewport = buildNextViewport({
      colorScheme: "light dark",
      initialScale: 1,
      themeColor: [
        { color: "#ffffff", media: "(prefers-color-scheme: light)" },
        { color: "#000000", media: "(prefers-color-scheme: dark)" },
      ],
      width: "device-width",
    });

    expect(viewport).toEqual({
      colorScheme: "light dark",
      initialScale: 1,
      themeColor: [
        { color: "#ffffff", media: "(prefers-color-scheme: light)" },
        { color: "#000000", media: "(prefers-color-scheme: dark)" },
      ],
      width: "device-width",
    });
  });

  it("builds robots, sitemap, and manifest route objects", () => {
    const robots = buildNextRobots({
      host: "https://acme.com",
      rules: [
        { allow: "/", userAgent: "*" },
        { disallow: ["/private"], userAgent: "Googlebot" },
      ],
      sitemap: ["https://acme.com/sitemap.xml"],
    });

    const sitemap = buildNextSitemap([
      {
        alternates: {
          languages: {
            de: "https://acme.com/de",
            en: "https://acme.com",
          },
        },
        changeFrequency: "weekly",
        images: ["https://acme.com/og.png"],
        lastModified: "2026-04-26",
        priority: 1,
        url: "https://acme.com",
      },
    ]);

    const manifest = buildNextManifest({
      background_color: "#ffffff",
      description: "Acme App",
      display: "standalone",
      icons: [
        {
          sizes: "192x192",
          src: "/icon-192.png",
          type: "image/png",
        },
      ],
      name: "Acme",
      screenshots: [
        {
          form_factor: "wide",
          sizes: "1280x720",
          src: "/screenshots/home.png",
          type: "image/png",
        },
      ],
      short_name: "Acme",
      shortcuts: [
        {
          name: "Dashboard",
          url: "/dashboard",
        },
      ],
      start_url: "/",
      theme_color: "#111111",
    });

    expect(robots).toEqual({
      host: "https://acme.com",
      rules: [
        { allow: "/", userAgent: "*" },
        { disallow: ["/private"], userAgent: "Googlebot" },
      ],
      sitemap: ["https://acme.com/sitemap.xml"],
    });
    expect(sitemap).toEqual([
      {
        alternates: {
          languages: {
            de: "https://acme.com/de",
            en: "https://acme.com",
          },
        },
        changeFrequency: "weekly",
        images: ["https://acme.com/og.png"],
        lastModified: "2026-04-26",
        priority: 1,
        url: "https://acme.com",
      },
    ]);
    expect(manifest).toEqual({
      background_color: "#ffffff",
      description: "Acme App",
      display: "standalone",
      icons: [
        {
          sizes: "192x192",
          src: "/icon-192.png",
          type: "image/png",
        },
      ],
      name: "Acme",
      screenshots: [
        {
          form_factor: "wide",
          sizes: "1280x720",
          src: "/screenshots/home.png",
          type: "image/png",
        },
      ],
      short_name: "Acme",
      shortcuts: [
        {
          name: "Dashboard",
          url: "/dashboard",
        },
      ],
      start_url: "/",
      theme_color: "#111111",
    });
  });
});
