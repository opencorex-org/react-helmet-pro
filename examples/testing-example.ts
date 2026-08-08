/**
 * react-helmet-pro/testing Usage Example
 * 
 * Shows how to integrate SEO matchers and snapshot serializers in Jest/Vitest.
 */

// ─── 1. Vitest/Jest Setup File (e.g., vitest.setup.ts or setupTests.js) ─────

import { expect } from 'vitest'; // or jest
import { seoMatchers, helmetSnapshotSerializer } from 'react-helmet-pro/testing/vitest';

// Register the custom SEO matchers
expect.extend(seoMatchers);

// Register the stable head snapshot serializer
expect.addSnapshotSerializer(helmetSnapshotSerializer);


// ─── 2. Example SEO Component Test ──────────────────────────────────────────

import { describe, it, expect as tExpect } from 'vitest';
import { parseHtmlToHelmetState } from 'react-helmet-pro/testing';

describe('SiteSeo component', () => {
  it('correctly sets canonical and indexability tags', () => {
    // Simulated SSR html output from react-helmet-pro
    const renderHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Aesthetically Premium Design</title>
          <link rel="canonical" href="https://example.com/premium-seo" />
          <link rel="alternate" hreflang="es" href="https://example.com/es/premium-seo" />
          <meta name="robots" content="index, follow" />
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Super Deluxe Plan",
              "offers": {
                "@type": "Offer",
                "price": "99.99",
                "priceCurrency": "USD"
              }
            }
          </script>
        </head>
      </html>
    `;

    // Matcher: toHaveCanonical
    tExpect(renderHtml).toHaveCanonical('https://example.com/premium-seo');

    // Matcher: toBeIndexable
    tExpect(renderHtml).toBeIndexable();

    // Matcher: toHaveHreflang
    tExpect(renderHtml).toHaveHreflang('es', 'https://example.com/es/premium-seo');

    // Matcher: toHaveValidStructuredData
    tExpect(renderHtml).toHaveValidStructuredData('Product', {
      name: 'Super Deluxe Plan',
      offers: {
        price: '99.99',
      }
    });
  });

  it('generates a stable, sorted HTML snapshot', () => {
    const rawHeadHtml = `
      <link rel="canonical" href="https://example.com" />
      <meta name="description" content="Stable snapshot example" />
      <title>Deterministic Snapshot</title>
    `;

    // With the registered snapshot serializer, this produces a beautifully sorted snapshot
    // putting <title> first, then sorted metas, then sorted links, independent of render order.
    tExpect(rawHeadHtml).toMatchInlineSnapshot(`
      <title>Deterministic Snapshot</title>
      <meta content="Stable snapshot example" name="description" />
      <link href="https://example.com" rel="canonical" />
    `);
  });
});
