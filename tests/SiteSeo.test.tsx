import "@testing-library/jest-dom";

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";

import { HelmetProvider } from "../src/context/HelmetProvider";
import { SiteSeo } from "../src/components/SiteSeo";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
} from "../src/utils/schemaBuilder";

describe("SiteSeo", () => {
  afterEach(() => {
    cleanup();
    document.title = "";
    document.head.innerHTML = "";
    document.documentElement.removeAttribute("lang");
  });

  it("builds website and organization schemas", () => {
    const webSite = buildWebSiteSchema({
      alternateName: "RHP",
      description: "Helmet-style SEO utilities for React apps.",
      inLanguage: ["en-US", "de-DE"],
      name: "React Helmet Pro",
      url: "https://reacthelmetpro.dev",
    });

    const organization = buildOrganizationSchema({
      alternateName: "RHP",
      contactPoints: [
        {
          availableLanguage: ["en", "de"],
          contactType: "customer support",
          email: "support@example.com",
        },
      ],
      logo: "https://reacthelmetpro.dev/logo.png",
      name: "React Helmet Pro",
      sameAs: ["https://github.com/opencorex-org/react-helmet-pro"],
      url: "https://reacthelmetpro.dev",
    });

    expect(webSite).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebSite",
      alternateName: "RHP",
      inLanguage: ["en-US", "de-DE"],
      name: "React Helmet Pro",
      url: "https://reacthelmetpro.dev",
    });

    expect(organization).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Organization",
      alternateName: "RHP",
      contactPoint: [
        {
          "@type": "ContactPoint",
          availableLanguage: ["en", "de"],
          contactType: "customer support",
          email: "support@example.com",
        },
      ],
      logo: {
        "@type": "ImageObject",
        url: "https://reacthelmetpro.dev/logo.png",
      },
      name: "React Helmet Pro",
      sameAs: ["https://github.com/opencorex-org/react-helmet-pro"],
      url: "https://reacthelmetpro.dev",
    });
  });

  it("renders site metadata with website and organization JSON-LD", async () => {
    render(
      <HelmetProvider>
        <SiteSeo
          alternateSiteName="RHP"
          canonical="https://reacthelmetpro.dev"
          description="A richer homepage SEO helper."
          locale="en-US"
          openGraph={{
            alternateLocale: ["de-DE"],
            images: [{ alt: "Homepage preview", url: "https://reacthelmetpro.dev/og.png" }],
          }}
          organization={{
            alternateName: "RHP",
            contactPoints: [
              {
                contactType: "customer support",
                email: "support@example.com",
              },
            ],
            logo: "https://reacthelmetpro.dev/logo.png",
            sameAs: ["https://github.com/opencorex-org/react-helmet-pro"],
          }}
          siteName="React Helmet Pro"
          title="React Helmet Pro"
          twitter={{
            creator: "@reacthelmetpro",
            images: ["https://reacthelmetpro.dev/twitter.png"],
          }}
        />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(document.title).toBe("React Helmet Pro");
    });

    expect(document.querySelector('meta[property="og:site_name"]')).toHaveAttribute(
      "content",
      "React Helmet Pro",
    );
    expect(document.querySelector('meta[property="og:locale:alternate"]')).toHaveAttribute(
      "content",
      "de-DE",
    );
    expect(document.querySelector('meta[name="twitter:image"]')).toHaveAttribute(
      "content",
      "https://reacthelmetpro.dev/twitter.png",
    );

    const scripts = Array.from(
      document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'),
    ).map((element) => element.textContent ?? "");

    expect(scripts).toHaveLength(2);
    expect(scripts.join(" ")).toContain('"@type":"WebSite"');
    expect(scripts.join(" ")).toContain('"alternateName":"RHP"');
    expect(scripts.join(" ")).toContain('"@type":"Organization"');
    expect(scripts.join(" ")).toContain('"sameAs":["https://github.com/opencorex-org/react-helmet-pro"]');
  });
});
