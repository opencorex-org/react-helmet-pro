import "@testing-library/jest-dom";

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";

import { HelmetProvider } from "../src/context/HelmetProvider";
import { Seo } from "../src/components/Seo";

describe("Seo", () => {
  afterEach(() => {
    cleanup();
    document.title = "";
    document.head.innerHTML = "";
    document.documentElement.removeAttribute("lang");
  });

  it("renders core SEO tags with Open Graph and Twitter fallbacks", async () => {
    render(
      <HelmetProvider>
        <Seo
          canonical="https://example.com/docs"
          description="A complete SEO helper."
          keywords={["react", "seo", "helmet"]}
          locale="en-US"
          openGraph={{
            alternateLocale: ["de-DE"],
            images: [
              {
                alt: "Open Graph preview",
                height: 630,
                url: "https://example.com/og.png",
                width: 1200,
              },
            ],
          }}
          siteName="React Helmet Pro"
          title="Docs Page"
          twitter={{
            creator: "@reacthelmetpro",
            images: ["https://example.com/twitter.png"],
          }}
        />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(document.title).toBe("Docs Page");
    });

    expect(document.documentElement).toHaveAttribute("lang", "en-US");
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      "A complete SEO helper.",
    );
    expect(document.querySelector('meta[name="keywords"]')).toHaveAttribute(
      "content",
      "react, seo, helmet",
    );
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://example.com/docs",
    );
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Docs Page",
    );
    expect(document.querySelector('meta[property="og:description"]')).toHaveAttribute(
      "content",
      "A complete SEO helper.",
    );
    expect(document.querySelector('meta[property="og:site_name"]')).toHaveAttribute(
      "content",
      "React Helmet Pro",
    );
    expect(document.querySelector('meta[property="og:locale:alternate"]')).toHaveAttribute(
      "content",
      "de-DE",
    );
    expect(document.querySelector('meta[property="og:image:alt"]')).toHaveAttribute(
      "content",
      "Open Graph preview",
    );
    expect(document.querySelector('meta[name="twitter:title"]')).toHaveAttribute(
      "content",
      "Docs Page",
    );
    expect(document.querySelector('meta[name="twitter:description"]')).toHaveAttribute(
      "content",
      "A complete SEO helper.",
    );
    expect(document.querySelector('meta[name="twitter:image"]')).toHaveAttribute(
      "content",
      "https://example.com/twitter.png",
    );
  });

  it("renders robots, alternates, and verification tags", async () => {
    render(
      <HelmetProvider>
        <Seo
          alternates={[
            { href: "https://example.com/de/docs", hrefLang: "de" },
            { href: "https://example.com/en/docs", hrefLang: "en" },
          ]}
          robots={{
            follow: false,
            googleBot: {
              follow: true,
              index: true,
              maxSnippet: -1,
            },
            googleBotNews: {
              index: false,
              indexIfEmbedded: true,
            },
            index: false,
            maxImagePreview: "large",
            noarchive: true,
          }}
          title="Robots Page"
          verification={{
            google: "google-token",
            msvalidate: "bing-token",
            other: [{ content: "custom-token", name: "facebook-domain-verification" }],
            yandex: "yandex-token",
          }}
        />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(document.title).toBe("Robots Page");
    });

    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow, noarchive, max-image-preview:large",
    );
    expect(document.querySelector('meta[name="googlebot"]')).toHaveAttribute(
      "content",
      "index, follow, max-snippet:-1",
    );
    expect(document.querySelector('meta[name="googlebot-news"]')).toHaveAttribute(
      "content",
      "noindex, indexifembedded",
    );
    expect(document.querySelector('link[rel="alternate"][hreflang="de"]')).toHaveAttribute(
      "href",
      "https://example.com/de/docs",
    );
    expect(document.querySelector('meta[name="google-site-verification"]')).toHaveAttribute(
      "content",
      "google-token",
    );
    expect(document.querySelector('meta[name="msvalidate.01"]')).toHaveAttribute(
      "content",
      "bing-token",
    );
    expect(document.querySelector('meta[name="facebook-domain-verification"]')).toHaveAttribute(
      "content",
      "custom-token",
    );
  });

  it("supports title defaults, templates, and priority SSR configuration", async () => {
    render(
      <HelmetProvider>
        <Seo
          defaultTitle="Example"
          description="Templated page"
          prioritizeSeoTags
          title="Docs"
          titleTemplate="%s | Example"
        />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(document.title).toBe("Docs | Example");
    });
  });

  it("renders article metadata and JSON-LD scripts", async () => {
    render(
      <HelmetProvider>
        <Seo
          description="Article description"
          jsonLd={[
            {
              "@context": "https://schema.org",
              "@type": "Article",
              headline: "Article title",
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [],
            },
          ]}
          openGraph={{
            authors: ["Jane Doe"],
            modifiedTime: "2026-05-02T12:00:00.000Z",
            publishedTime: "2026-05-01T12:00:00.000Z",
            section: "Guides",
            tags: ["SEO", "React"],
            type: "article",
          }}
          title="Article title"
        />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(document.title).toBe("Article title");
    });

    expect(document.querySelector('meta[property="article:published_time"]')).toHaveAttribute(
      "content",
      "2026-05-01T12:00:00.000Z",
    );
    expect(document.querySelector('meta[property="article:modified_time"]')).toHaveAttribute(
      "content",
      "2026-05-02T12:00:00.000Z",
    );
    expect(document.querySelector('meta[property="article:author"]')).toHaveAttribute(
      "content",
      "Jane Doe",
    );
    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(2);
    expect(document.querySelector('script#seo-jsonld-1')?.textContent).toContain('"Article"');
  });
});
