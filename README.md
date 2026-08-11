## React Helmet Pro

[![npm version](https://img.shields.io/npm/v/react-helmet-pro.svg)](https://www.npmjs.com/package/react-helmet-pro)
[![License](https://img.shields.io/github/license/opencorex-org/react-helmet-pro)](LICENSE)
[![Build Status](https://github.com/lahiruudayakumara/react-helmet-pro/actions/workflows/build.yml/badge.svg)](https://github.com/lahiruudayakumara/react-helmet-pro/actions)
[![npm downloads](https://img.shields.io/npm/dm/react-helmet-pro.svg)](https://www.npmjs.com/package/react-helmet-pro)
[![GitHub stars](https://img.shields.io/github/stars/opencorex-org/react-helmet-pro?style=social)](https://github.com/opencorex-org/react-helmet-pro)
[![GitHub issues](https://img.shields.io/github/issues/opencorex-org/react-helmet-pro)](https://github.com/opencorex-org/react-helmet-pro/issues)
[![Code Coverage](https://img.shields.io/codecov/c/github/lahiruudayakumara/react-helmet-pro)](https://codecov.io/gh/opencorex-org/react-helmet-pro)

**React Helmet Pro** is an advanced, modular, and SSR compatible head manager for React applications. It now supports the familiar `react-helmet` / `react-helmet-async` API alongside its higher-level helpers for structured data, analytics, favicons, and security metadata.

> Robust head management for SEO, analytics, and SSR made simple.

---

## Features

- `react-helmet`-style child tag API
- `react-helmet-async`-style `HelmetProvider` request context
- Dynamic `<title>`, `<base>`, `<meta>`, `<link>`, `<script>`, `<style>`, `<noscript>` injection
- High-level `<Seo />` component for common SEO tags
- `<SiteSeo />` for homepage metadata, site names, and organization identity
- `<ArticleSeo />` plus breadcrumb and FAQ rich-result helpers
- `htmlAttributes`, `bodyAttributes`, and `titleAttributes`
- `titleTemplate`, `defaultTitle`, `defer`, and `onChangeClientState`
- `Helmet.renderStatic()`, `Helmet.peek()`, and `HelmetData`
- SEO tag prioritization for SSR via `prioritizeSeoTags`
- Next.js App Router helpers for `metadata`, `viewport`, `robots.ts`, `sitemap.ts`, and `manifest.ts`
- JSON-LD Structured Data support
- Google Analytics integration
- Favicons & SEO helpers
- Security meta tags (CSP, nosniff, etc.)
- Deterministic URL and descriptor security diagnostics with stable rule IDs
- SSR-friendly with `collectHelmetTags()`
- Middleware support for reusable helmet logic
- Context API for global helmet state
- TypeScript support out of the box

---

## Installation

```bash
# npm
npm install react-helmet-pro

# pnpm
pnpm add react-helmet-pro

# yarn
yarn add react-helmet-pro
```

The new Next.js helpers are framework-agnostic utilities, so you can use them in a Next.js app without adding any extra runtime dependency from this package.

---

## Feature Comparison

This table compares the documented feature surface of `react-helmet-pro`, `react-helmet`, `react-helmet-async`, and the Next.js App Router Metadata API.

`Partial` means the capability exists, but not as a first-class helper in that tool.

| Capability | `react-helmet-pro` | `react-helmet` | `react-helmet-async` | Next.js Metadata API |
|------------|--------------------|----------------|----------------------|----------------------|
| Helmet-style child tag API | Yes | Yes | Yes | No |
| Thread-safe SSR context per request | Yes | No | Yes | Server-only metadata model |
| `Helmet.renderStatic()` style extraction | Yes | Yes | No | No |
| `HelmetData` usage without a provider | Yes | No | Yes | No |
| `prioritizeSeoTags` SSR output | Yes | No | Yes | No |
| Next.js `metadata` / `generateMetadata` helper builders | Yes | No | No | Built in |
| Next.js `viewport` / `generateViewport` helper builders | Yes | No | No | Built in |
| Next.js `robots.ts` / `sitemap.ts` / `manifest.ts` builders | Yes | No | No | Built in |
| JSON-LD helper component | Yes | No | No | Partial |
| High-level SEO helper component | Yes | No | No | No |
| Analytics helper component | Yes | No | No | No |
| Security meta helper component | Yes | No | No | Partial |
| Middleware hook for reusable head transforms | Yes | No | No | No |
| Built-in helper for reading live Helmet state | Yes | No | No | No |
| `<base>`, `<noscript>`, inline `<script>`, inline `<style>` support through a Helmet API | Yes | Yes | Yes | No in metadata config |

If you are using App Router, Next.js itself is the best fit for canonical SEO fields like title, description, Open Graph, Twitter cards, robots, sitemap, and manifest. `react-helmet-pro` is meant to complement that with helper builders, JSON-LD helpers, and a Helmet API for the head tags the Metadata API does not model directly.

---

## Framework Compatibility Matrix

All framework and server adapters are provided via dedicated subpath entry points (`react-helmet-pro/react-router`, `react-helmet-pro/remix`, `react-helmet-pro/astro`, `react-helmet-pro/vite-ssr`, `react-helmet-pro/express`, `react-helmet-pro/fastify`, `react-helmet-pro/hono`, `react-helmet-pro/server`, `react-helmet-pro/adapters`) ensuring **zero core bundle impact** when unused.

| Framework / Runtime | Adapter Entry Point | Capabilities & Feature Surface |
|---------------------|---------------------|--------------------------------|
| **React Router (v6 / v7)** | `react-helmet-pro/react-router` | Route `meta` descriptor array builder, loader data helper (`defineRouteSeo`), `createReactRouterMeta` |
| **Remix** | `react-helmet-pro/remix` | `toRemixMeta`, `toRemixLinks`, `toRemixHeaders` (`X-Robots-Tag`, CSP, HTTP equiv) |
| **Astro** | `react-helmet-pro/astro` | `collectAstroHead`, `renderAstroHeadToString`, `getAstroRobotsHeader` for Astro SSR |
| **Vite SSR** | `react-helmet-pro/vite-ssr` | Template injection (`injectHelmetIntoHtml`), streaming stream transform (`createViteSsrStreamTransform`), early head flush markers |
| **Express** | `react-helmet-pro/express` | Request-isolated context (`req.helmet`), `res.locals.helmet`, response finish cleanup, automatic `X-Robots-Tag` |
| **Fastify** | `react-helmet-pro/fastify` | Fastify plugin with `request.helmet`, `onSend`/`onResponse` cleanup, automatic `X-Robots-Tag` header |
| **Hono** | `react-helmet-pro/hono` | Hono middleware (`c.set('helmet', ...)`), response finish cleanup, automatic `X-Robots-Tag` header (`c.header(...)`) |


---

# Basic Usage

### Wrap Your App

```tsx
import { HelmetProvider } from 'react-helmet-pro';

function App() {
  return (
    <HelmetProvider>
      <MainRouter />
    </HelmetProvider>
  );
}
```

### Site-Wide Provider SEO Defaults & Social Metadata Fallbacks

Configure consistent site-wide SEO defaults once on `<HelmetProvider>` while preserving explicit page overrides.

#### Precedence Hierarchy

Metadata fields are resolved according to a strict, predictable precedence hierarchy:

$$\text{Library Defaults} < \text{Provider Defaults} < \text{Nested Provider Defaults} < \text{Page Overrides}$$

Explicit values provided at the page level (on `<Seo />`, `<ArticleSeo />`, `<SiteSeo />`, or `<Helmet />`) are **never** overwritten by fallbacks or provider defaults.

#### Provider Defaults Configuration

```tsx
import { HelmetProvider, Seo } from 'react-helmet-pro';

function App() {
  return (
    <HelmetProvider
      defaults={{
        baseUrl: 'https://example.com',
        siteName: 'My Awesome Application',
        titleTemplate: '%s | My Awesome Application',
        defaultTitle: 'My Awesome Application',
        locale: 'en_US',
        description: 'Site-wide default description for search engines and social previews.',
        socialImage: {
          url: 'https://example.com/default-og.png',
          alt: 'Site logo preview',
          width: 1200,
          height: 630,
        },
        robots: { index: true, follow: true, maxImagePreview: 'large' },
        verification: { google: 'google-site-verification-token' },
        twitter: { site: '@my_app_handle', creator: '@author_handle' },
      }}
    >
      <MainApp />
    </HelmetProvider>
  );
}

// On any page: minimal props automatically inherit site defaults & social fallbacks!
function DashboardPage() {
  return (
    <Seo
      title="Dashboard"
      canonical="/dashboard"
    />
  );
  // Resolves:
  // - title: "Dashboard | My Awesome Application"
  // - canonical: "https://example.com/dashboard"
  // - og:site_name: "My Awesome Application"
  // - og:description: "Site-wide default description..."
  // - og:image: "https://example.com/default-og.png"
  // - twitter:card: "summary_large_image"
  // - twitter:site: "@my_app_handle"
  // - twitter:title: "Dashboard"
}
```

#### Automatic Social Metadata Fallbacks

When Open Graph or Twitter metadata is missing on a page, `react-helmet-pro` automatically derives social metadata:
- **Open Graph**: `og:title` derived from `title`, `og:description` derived from `description`, `og:url` derived from `canonical` / `baseUrl`, `og:site_name` from `siteName`, `og:locale` from `locale`, and `og:image` from `socialImage` / `image`.
- **Twitter Cards**: `twitter:title` derived from Open Graph title or `title`, `twitter:description` derived from Open Graph description or `description`, `twitter:image` derived from Open Graph image or `socialImage`, and `twitter:card` derived from image presence (`summary_large_image`).

#### Disabling Fallbacks

You can disable fallbacks globally, per-provider, or per-component:

```tsx
// 1. Disable globally or per-provider
<HelmetProvider defaults={{ fallbacks: false }}>
  ...
</HelmetProvider>

// 2. Selectively disable only Twitter fallbacks
<HelmetProvider defaults={{ fallbacks: { twitter: false } }}>
  ...
</HelmetProvider>

// 3. Disable fallbacks on a specific page component
<Seo disableFallbacks title="Special Page" />
```

#### Nested Provider Inheritance

Nested `<HelmetProvider>` instances inherit and merge SEO defaults from parent providers:

```tsx
<HelmetProvider defaults={{ siteName: 'Parent Portal', locale: 'en' }}>
  <HelmetProvider defaults={{ siteName: 'Blog Sub-site' }}>
    {/* Child pages inherit locale 'en' from parent and siteName 'Blog Sub-site' from nested provider */}
  </HelmetProvider>
</HelmetProvider>
```

#### Reading Active Defaults (`useSeoDefaults`)

Use the `useSeoDefaults()` hook inside any component to inspect active merged provider defaults:

```tsx
import { useSeoDefaults } from 'react-helmet-pro';

function BrandingFooter() {
  const seoDefaults = useSeoDefaults();
  return <footer>{seoDefaults?.siteName}</footer>;
}
}

### Canonical URL Resolution & Normalization Policies

Keep canonical, Open Graph, alternate `hreflang`, and structured-data URLs safe, canonical, and consistent across development, staging, and production environments.

> [!NOTE]
> **Normalization vs. HTTP Redirects**:
> URL normalization standardizes head metadata (`<link rel="canonical">`, `<meta property="og:url">`, `hreflang`, and JSON-LD `@id`/`url` fields) rendered in HTML to prevent duplicate indexing by search crawlers. It does not replace server-side HTTP 301/302 redirects.

#### Pure Normalization Utility (`normalizeSeoUrl`)

Use `normalizeSeoUrl` or `createUrlNormalizer` as pure, environment-agnostic utilities (free of `window.location` dependencies) with identical SSR and client output.

```tsx
import { normalizeSeoUrl, createUrlNormalizer } from 'react-helmet-pro';

// Accepts both string and URL object inputs
const canonicalUrl = normalizeSeoUrl('/products/widget#overview?utm_source=ad&page=2', {
  baseUrl: 'https://example.com',
  trailingSlash: 'always',         // 'always' | 'never' | 'preserve'
  stripFragment: true,             // Strips #hash fragments
  stripTrackingParams: true,       // Strips utm_*, gclid, fbclid, etc.
  sortQueryParams: true,           // Alphabetically sorts query keys
});
// Output: "https://example.com/products/widget/?page=2"

// Factory pattern for reusable policies
const normalizeDocUrl = createUrlNormalizer({
  baseUrl: 'https://docs.example.com',
  trailingSlash: 'never',
  sortQueryParams: true,
});
```

#### Provider & Component Level Policies

URL policies can be set on `<HelmetProvider>` or overridden per-component:

```tsx
<HelmetProvider
  defaults={{
    baseUrl: 'https://example.com',
    urlPolicy: {
      trailingSlash: 'never',
      stripTrackingParams: true,
      sortQueryParams: true,
      allowedQueryParams: ['page', 'search', 'category'],
    },
  }}
>
  <App />
</HelmetProvider>

// On any page component:
<Seo
  title="Search Results"
  canonical="/search?utm_source=ad&search=react&page=1"
  urlPolicy={{
    sortQueryParams: true,
  }}
/>
// Automatically normalizes canonical link, og:url, and hreflang links:
// - <link rel="canonical" href="https://example.com/search?page=1&search=react" />
// - <meta property="og:url" content="https://example.com/search?page=1&search=react" />
```

#### Policy Configuration Options

| Policy Option | Type | Description | Default |
|---|---|---|---|
| `baseUrl` | `string \| URL` | Base URL used to resolve relative pathnames | `undefined` |
| `trailingSlash` | `'always' \| 'never' \| 'preserve'` | Appends or removes trailing slash (preserves file extensions like `.png`) | `'preserve'` |
| `stripFragment` | `boolean` | Strips hash fragments (`#section`) from URL | `false` |
| `stripTrackingParams` | `boolean` | Strips analytics/marketing parameters (`utm_*`, `gclid`, `fbclid`, etc.) | `false` |
| `allowedQueryParams` | `string[]` | Strict allowlist of query parameters to retain | `undefined` |
| `deniedQueryParams` | `string[]` | Denylist of query parameters to strip | `undefined` |
| `sortQueryParams` | `boolean` | Alphabetically sorts query parameters for deterministic output | `false` |
| `lowercaseHost` | `boolean` | Lowercases scheme and hostname (supports IDNs/Punycode and custom ports) | `true` |

### Advanced Robots Directives & HTTP X-Robots-Tag

Fine-grained control over search engine crawlers with typed directives, built-in presets, and shared serialization between HTML `<meta>` tags and SSR `X-Robots-Tag` HTTP response headers.

#### Robots Presets (`ROBOTS_PRESETS`)

```tsx
import { ROBOTS_PRESETS, Seo } from 'react-helmet-pro';

// Use built-in presets
<Seo
  title="User Dashboard"
  robots={ROBOTS_PRESETS.PRIVATE} // { index: false, follow: false, noarchive: true, nocache: true, nosnippet: true }
/>

// Available Presets:
// - ROBOTS_PRESETS.INDEX_FOLLOW: { index: true, follow: true }
// - ROBOTS_PRESETS.NOINDEX_NOFOLLOW: { index: false, follow: false }
// - ROBOTS_PRESETS.NOINDEX_FOLLOW: { index: false, follow: true }
// - ROBOTS_PRESETS.INDEX_NOFOLLOW: { index: true, follow: false }
// - ROBOTS_PRESETS.PRIVATE: { index: false, follow: false, noarchive: true, nocache: true, nosnippet: true }
// - ROBOTS_PRESETS.MAXIMAL: { index: true, follow: true, maxImagePreview: "large", maxSnippet: -1, maxVideoPreview: -1 }
```

#### Crawler-Specific Directives & SSR X-Robots-Tag Header Builder

```tsx
import { buildXRobotsTagHeader, buildXRobotsTagHeaderString } from 'react-helmet-pro';

// 1. In your Node.js / Express / Next.js SSR server response:
app.get('/admin', (req, res) => {
  const headers = buildXRobotsTagHeader({
    index: false,
    follow: false,
    googleBot: { noarchive: true, maxSnippet: 0 },
    customCrawlers: { GPTBot: { index: false } },
  });

  res.set(headers);
  // Sets Header: "X-Robots-Tag: noindex, nofollow, googlebot: noarchive, max-snippet:0, gptbot: noindex"
});
```

---

### International SEO & Hreflang Management (`LocalizedSeo`)

Manage multi-regional and multi-lingual web applications with automatic BCP 47 locale normalization, `x-default` resolution, self-referencing links, title/description language maps, and deterministic tag sorting.

```tsx
import { LocalizedSeo } from 'react-helmet-pro';

function MultiLingualProductPage() {
  return (
    <LocalizedSeo
      currentLocale="fr-FR"
      locales={{
        'en-US': 'https://example.com/en/product',
        'fr-FR': 'https://example.com/fr/produit',
        'de-DE': 'https://example.com/de/produkt',
      }}
      titleMap={{
        'en-US': 'Awesome Widget',
        'fr-FR': 'Produit Formidable',
        'de-DE': 'Tolles Produkt',
      }}
      descriptionMap={{
        'en-US': 'Buy our awesome widget online.',
        'fr-FR': 'Achetez notre produit formidable en ligne.',
      }}
      autoXDefault={true}         // Automatically adds hreflang="x-default"
      autoSelfReference={true}    // Guarantees self-referencing hreflang tag
    />
  );
  // Automatically renders:
  // - <title>Produit Formidable</title>
  // - <html lang="fr-FR">
  // - <link rel="canonical" href="https://example.com/fr/produit" />
  // - <link rel="alternate" hreflang="de-DE" href="https://example.com/de/produkt" />
  // - <link rel="alternate" hreflang="en-US" href="https://example.com/en/product" />
  // - <link rel="alternate" hreflang="fr-FR" href="https://example.com/fr/produit" />
  // - <link rel="alternate" hreflang="x-default" href="https://example.com/en/product" />
}
```

---

### Expanded Google Search Structured Data (JSON-LD)

Framework-agnostic pure schema builders and type-safe React components for major Google Search rich features.

> [!NOTE]
> **Eligibility Disclaimer**:
> Adding structured data enhances eligibility for Google search rich features, but rich result display is subject to Google's search algorithms and site quality guidelines.

#### React JSON-LD Component Helpers

```tsx
import {
  ProductJsonLd,
  JobPostingJsonLd,
  EventJsonLd,
  LocalBusinessJsonLd,
  RecipeJsonLd,
} from 'react-helmet-pro';

// 1. E-Commerce Product with Offers, Merchant Return Policy & Shipping Details
<ProductJsonLd
  product={{
    name: 'Pro Audio Headphones',
    description: 'Noise cancelling studio headphones.',
    brand: 'Acme Sound',
    sku: 'ACME-HEADPHONE-01',
    offers: {
      price: 199.99,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      hasMerchantReturnPolicy: {
        merchantReturnDays: 30,
        returnFees: 'https://schema.org/FreeReturn',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      },
      shippingDetails: {
        shippingDestination: { addressCountry: 'US' },
        shippingRate: { currency: 'USD', value: 0 },
      },
    },
  }}
/>

// 2. Job Posting
<JobPostingJsonLd
  jobPosting={{
    title: 'Senior Frontend Engineer',
    description: 'We are hiring a React and Next.js specialist.',
    datePosted: '2026-07-29',
    hiringOrganization: { name: 'Acme Inc', logo: 'https://example.com/logo.png' },
    jobLocation: { addressLocality: 'San Francisco', addressCountry: 'US' },
  }}
/>
```

#### Pure Framework-Independent Builders

```tsx
import {
  buildProductSchema,
  buildJobPostingSchema,
  buildEventSchema,
  buildRecipeSchema,
  buildLocalBusinessSchema,
} from 'react-helmet-pro';

// Pure JavaScript objects suitable for Next.js Metadata API, Remix, Svelte, or Node backends
const productJson = buildProductSchema({
  name: 'Studio Monitor',
  offers: { price: 299.99, priceCurrency: 'USD' },
});
```

#### Supported Schema Catalog & References

| Category | Supported Schemas & Components | Specification References |
|---|---|---|
| **E-Commerce** | `ProductJsonLd`, `ProductGroupJsonLd`, `Offer`, `MerchantReturnPolicy`, `OfferShippingDetails` | [Google Product Snippets](https://developers.google.com/search/docs/appearance/structured-data/product-information) \| [Schema.org Product](https://schema.org/Product) |
| **Business & Employment** | `LocalBusinessJsonLd`, `JobPostingJsonLd` | [Google Job Posting](https://developers.google.com/search/docs/appearance/structured-data/job-posting) \| [Schema.org LocalBusiness](https://schema.org/LocalBusiness) |

---

### JSON-LD Graph Composition & Entity Registry (`StructuredDataGraph`)

Compose complex web graphs of organizations, websites, products, and articles without duplicating entity nodes. Entities sharing the same `@id` are automatically deduplicated and deeply merged.

```tsx
import {
  StructuredDataGraph,
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildArticleSchema,
  createEntityRef,
} from 'react-helmet-pro';

function GraphPage() {
  const org = {
    ...buildOrganizationSchema({ name: 'Acme Corp', logo: 'https://example.com/logo.png' }),
    '@id': 'https://example.com/#organization',
  };

  const site = {
    ...buildWebSiteSchema({ name: 'Acme Portal', url: 'https://example.com' }),
    '@id': 'https://example.com/#website',
    publisher: createEntityRef('https://example.com/#organization'),
  };

  const article = {
    ...buildArticleSchema({ headline: 'Graph Composition in React' }),
    '@id': 'https://example.com/blog/article-1#article',
    publisher: createEntityRef('https://example.com/#organization'),
    isPartOf: createEntityRef('https://example.com/#website'),
  };

  return <StructuredDataGraph entities={[org, site, article]} />;
}
// Outputs single unified JSON-LD @graph:
// {
//   "@context": "https://schema.org",
//   "@graph": [
//     { "@id": "https://example.com/#organization", "@type": "Organization", ... },
//     { "@id": "https://example.com/#website", "@type": "WebSite", ... },
//     { "@id": "https://example.com/blog/article-1#article", "@type": "Article", ... }
//   ]
// }
```

#### Deduplication & Conflict Merging Rules
- **Automatic Merging**: Entities with identical `@id` and compatible `@type` are deeply merged. Primitive array fields are deduplicated.
- **Conflict Warning**: Mismatched `@type` definitions under the same `@id` generate a `RHP_SEO_GRAPH_CONFLICT` diagnostic warning.
- **Circular References**: Safely handled during serialization without stack overflows.

### Sitemap, Robots.txt, and Indexing Route Generators

Framework-agnostic pure builders, XML extensions (image, video, news, hreflang), protocol limit chunkers, typed `robots.txt` builder, CI production blocking safety audit, IndexNow payload adapter, and Next.js / Web standard route handlers.

#### 1. Standards-Compliant Sitemap XML Generator (`buildSitemapXml`)

```tsx
import { buildSitemapXml, chunkSitemapUrls } from 'react-helmet-pro';

const urls = [
  {
    loc: 'https://example.com/products/widget',
    lastmod: '2026-07-29',
    changefreq: 'weekly',
    priority: 0.8,
    alternates: [{ hrefLang: 'fr', href: 'https://example.com/fr/products/widget' }],
    images: [{ url: 'https://example.com/widget.jpg', title: 'Pro Widget' }],
  },
];

// Protocol limit chunking helper (max 50,000 URLs per file)
const sitemapChunks = chunkSitemapUrls(urls, 50000);
const sitemapXml = buildSitemapXml(sitemapChunks[0]);
// Automatically includes xmlns:image and xmlns:xhtml namespaces only when present!
```

#### 2. Typed Robots.txt Builder & CI Safety Audit (`isProductionRobotsBlocking`)

```tsx
import { buildRobotsTxt, isProductionRobotsBlocking } from 'react-helmet-pro';

const robotsTxt = buildRobotsTxt({
  host: 'https://example.com',
  rules: [
    { userAgent: '*', allow: '/', disallow: ['/admin', '/private'] },
    { userAgent: 'GPTBot', disallow: '/' },
  ],
  sitemaps: ['https://example.com/sitemap.xml'],
});

// CI / CD Production Safety Audit:
if (process.env.NODE_ENV === 'production' && isProductionRobotsBlocking(robotsTxt)) {
  throw new Error('CRITICAL SEO FAILURE: Production robots.txt contains Disallow: / blocking search engine crawlers!');
}
```

#### 3. IndexNow Instant Indexing Submission

```tsx
import { buildIndexNowPayload, submitIndexNowPayload } from 'react-helmet-pro';

// 1. Build validated payload
const payload = buildIndexNowPayload({
  host: 'example.com',
  key: '805a4f4e7c10423bb0d97034b76a08c0',
  urlList: ['https://example.com/blog/new-article'],
});

// 2. Opt-in submission
await submitIndexNowPayload(payload);
```

#### 4. Next.js App Router & Web Standard Server Route Handlers

```tsx
// app/sitemap.xml/route.ts
import { createSitemapRouteHandler } from 'react-helmet-pro';

export const GET = createSitemapRouteHandler([
  { loc: 'https://example.com/', priority: 1.0 },
  { loc: 'https://example.com/about', priority: 0.8 },
]);

// app/robots.txt/route.ts
import { createRobotsTxtRouteHandler } from 'react-helmet-pro';

---

### Head Tag Identity Matrix, Concurrency & State Restoration

`react-helmet-pro` uses a deterministic tag identity matrix to decide when head tags overwrite each other versus when multiple declarations coexist.

#### Tag Identity Precedence Matrix

| Tag Type | Identity Discriminator | Behaviour & Multi-Value Policy |
|---|---|---|
| **Explicit Key** | `key="custom-id"` | Overrides any tag with matching `key` regardless of attributes |
| **Single-Instance Meta** | `name="description"`, `name="viewport"`, `property="og:title"` | Single active instance; nested overrides parent |
| **Repeatable Meta** | `property="og:image"`, `property="article:author"`, `property="og:see_also"` | Multiple distinct values coexist; identical duplicates deduplicated |
| **Icon Links** | `rel="icon"` + `sizes="32x32"` | Differentiated by size and href; distinct favicon sizes coexist |
| **Stylesheet & Links** | `rel="stylesheet"`, `rel="canonical"` | Canonical is single instance; stylesheets differentiated by `href` |

#### Explicit Key Overrides & Repeatable Tags

```tsx
import { Helmet, getTagIdentityKey } from 'react-helmet-pro';

// 1. Explicit Key Override: Overrides theme-color regardless of content
<Helmet>
  <meta key="theme" name="theme-color" content="#ffffff" />
</Helmet>

// 2. Repeatable OG Images: Multiple images coexist for rich social previews
<Helmet>
  <meta property="og:image" content="https://example.com/cover-1.jpg" />
  <meta property="og:image" content="https://example.com/cover-2.jpg" />
</Helmet>

// Query identity key programmatically
const key = getTagIdentityKey('meta', { property: 'og:image', content: 'https://example.com/cover-1.jpg' });
// "meta:property:og:image:https://example.com/cover-1.jpg"
```
---

### CSP Nonces, Secure Tag Placement, and Performance Resource Hints

Request-scoped Content Security Policy (CSP) nonce propagation, body tag placement collections (`bodyOpen`, `bodyClose`), typed resource hint components (`<Preload />`, `<Preconnect />`, `<DnsPrefetch />`), and Subresource Integrity (SRI) validation.

#### 1. Request-Scoped CSP Nonce Propagation

```tsx
import { HelmetProvider, Helmet } from 'react-helmet-pro';

// 1. Pass request-scoped nonce to HelmetProvider
<HelmetProvider nonce={req.cspNonce}>
  <App />
</HelmetProvider>

// All inline <script>, <style>, and JSON-LD scripts automatically inherit nonce="rAnd0mN0nc3"!
```

#### 2. Secure Tag Placement (`bodyOpen` and `bodyClose` SSR Extraction)

```tsx
<Helmet>
  {/* Injected into <head> */}
  <script src="/head-script.js" />

  {/* Injected at top of <body> */}
  <script tagPosition="bodyOpen" dangerouslySetInnerHTML={{ __html: 'console.log("Top of body")' }} />

  {/* Injected at bottom of <body> right before </body> */}
  <script tagPosition="bodyClose" src="/analytics-bottom.js" />
</Helmet>
```

In Server-Side Rendering (Node.js / Next.js / Remix):
```tsx
const context = {};
const appHtml = renderToString(<HelmetProvider context={context}><App /></HelmetProvider>);
const { helmet } = context;

// Access bodyOpen and bodyClose collections cleanly:
const bodyOpenHtml = helmet.bodyOpenScripts.toString();
const bodyCloseHtml = helmet.bodyCloseScripts.toString();
```

#### 3. Typed Performance Resource Hint Components

```tsx
import { Preload, ModulePreload, Preconnect, DnsPrefetch, Prefetch } from 'react-helmet-pro';

// Preload fonts, scripts, and responsive hero images
<Preload
  href="/fonts/inter.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>

<Preload
  href="/hero.jpg"
  as="image"
  imageSrcSet="/hero-400.jpg 400w, /hero-800.jpg 800w"
  imageSizes="100vw"
  fetchPriority="high"
/>

// Preconnect to CDNs & API origins
<Preconnect href="https://fonts.googleapis.com" crossOrigin="anonymous" />
<DnsPrefetch href="https://cdn.example.com" />
<Prefetch href="/next-page" />
```

#### Threat Model & Security Diagnostics
- **SRI Enforcement**: Triggers `RHP_SECURITY_MISSING_SRI` suggestions for cross-origin scripts/stylesheets lacking `integrity` hashes.
- **Duplicate Hint Detection**: Triggers `RHP_SECURITY_DUPLICATE_RESOURCE_HINT` warnings when duplicate `preconnect` or `dns-prefetch` directives target the same origin.
- **Strict Scheme Validation**: Catches malicious `javascript:` or unexpected protocol schemes.
=======
```

---

### CSP Nonces, Secure Tag Placement, and Performance Resource Hints

Request-scoped Content Security Policy (CSP) nonce propagation, body tag placement collections (`bodyOpen`, `bodyClose`), typed resource hint components (`<Preload />`, `<Preconnect />`, `<DnsPrefetch />`), and Subresource Integrity (SRI) validation.

#### 1. Request-Scoped CSP Nonce Propagation

```tsx
import { HelmetProvider, Helmet } from 'react-helmet-pro';

// 1. Pass request-scoped nonce to HelmetProvider
<HelmetProvider nonce={req.cspNonce}>
  <App />
</HelmetProvider>

// All inline <script>, <style>, and JSON-LD scripts automatically inherit nonce="rAnd0mN0nc3"!
```

#### 2. Secure Tag Placement (`bodyOpen` and `bodyClose` SSR Extraction)

```tsx
<Helmet>
  {/* Injected into <head> */}
  <script src="/head-script.js" />

  {/* Injected at top of <body> */}
  <script tagPosition="bodyOpen" dangerouslySetInnerHTML={{ __html: 'console.log("Top of body")' }} />

  {/* Injected at bottom of <body> right before </body> */}
  <script tagPosition="bodyClose" src="/analytics-bottom.js" />
</Helmet>
```

In Server-Side Rendering (Node.js / Next.js / Remix):
```tsx
const context = {};
const appHtml = renderToString(<HelmetProvider context={context}><App /></HelmetProvider>);
const { helmet } = context;

// Access bodyOpen and bodyClose collections cleanly:
const bodyOpenHtml = helmet.bodyOpenScripts.toString();
const bodyCloseHtml = helmet.bodyCloseScripts.toString();
```

#### 3. Typed Performance Resource Hint Components

```tsx
import { Preload, ModulePreload, Preconnect, DnsPrefetch, Prefetch } from 'react-helmet-pro';

// Preload fonts, scripts, and responsive hero images
<Preload
  href="/fonts/inter.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>

<Preload
  href="/hero.jpg"
  as="image"
  imageSrcSet="/hero-400.jpg 400w, /hero-800.jpg 800w"
  imageSizes="100vw"
  fetchPriority="high"
/>

// Preconnect to CDNs & API origins
<Preconnect href="https://fonts.googleapis.com" crossOrigin="anonymous" />
<DnsPrefetch href="https://cdn.example.com" />
<Prefetch href="/next-page" />
```

#### Threat Model & Security Diagnostics
- **SRI Enforcement**: Triggers `RHP_SECURITY_MISSING_SRI` suggestions for cross-origin scripts/stylesheets lacking `integrity` hashes.
- **Duplicate Hint Detection**: Triggers `RHP_SECURITY_DUPLICATE_RESOURCE_HINT` warnings when duplicate `preconnect` or `dns-prefetch` directives target the same origin.
- **Strict Scheme Validation**: Catches malicious `javascript:` or unexpected protocol schemes.




---

### Next.js App Router Integration (`react-helmet-pro/next`)

A zero-runtime-dependency, version-aware Next.js App Router integration. All utilities work as pure functions importable in Next.js 13, 14, 15 and non-Next.js environments alike.

#### Metadata Mapping Table

| `react-helmet-pro` | Next.js `Metadata` |
|---|---|
| `title` | `metadata.title` (string or `{ default, absolute, template }`) |
| `link rel="canonical"` | `metadata.alternates.canonical` |
| `link rel="alternate" hreflang="..."` | `metadata.alternates.languages` |
| `meta name="description"` | `metadata.description` |
| `meta property="og:title"` | `metadata.openGraph.title` |
| `meta property="og:description"` | `metadata.openGraph.description` |
| `meta property="og:image"` | `metadata.openGraph.images[]` |
| `meta property="og:url"` | `metadata.openGraph.url` |
| `meta name="twitter:card"` | `metadata.twitter.card` |
| `meta name="robots"` | `metadata.robots` |
| `meta name="google-site-verification"` | `metadata.verification.google` |
| JSON-LD `<script type="application/ld+json">` | `<ServerJsonLd schema={...} />` (RSC) |

#### 1. Bidirectional Conversion

```tsx
import { helmetToNextMetadata, nextMetadataToHelmet } from 'react-helmet-pro/next';

// Helmet → Next.js (for App Router generateMetadata)
const helmProps = {
  title: 'Product Title',
  meta: [{ name: 'description', content: 'Great product' }],
  link: [{ rel: 'canonical', href: 'https://acme.com/products/widget' }],
};
const metadata = helmetToNextMetadata(helmProps);
// { title: 'Product Title', description: 'Great product', alternates: { canonical: 'https://acme.com/products/widget' } }

// Next.js → Helmet (for hybrid Pages Router / Client components)
const backToHelmet = nextMetadataToHelmet(metadata);
```

#### 2. `createGenerateMetadata` — App Router `generateMetadata` Helper

```ts
// app/products/[id]/page.tsx
import { createGenerateMetadata } from 'react-helmet-pro/next';

export const generateMetadata = createGenerateMetadata(
  async ({ params }) => ({
    title: `Product ${params.id}`,
    description: 'View product details.',
    alternates: { canonical: `/products/${params.id}` }, // relative URLs auto-resolved
  }),
  { siteUrl: 'https://acme.com' }
);
```

#### 3. Server Component-safe JSON-LD

```tsx
// app/products/[id]/page.tsx (React Server Component - no 'use client')
import { ServerJsonLd } from 'react-helmet-pro/next';

export default async function ProductPage({ params }) {
  return (
    <>
      <ServerJsonLd
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Widget',
          offers: { '@type': 'Offer', price: '29.99', priceCurrency: 'USD' },
        }}
        id="product-schema"
        nonce={nonce}
      />
    </>
  );
}
```

#### 4. File-Based Metadata Routes

```ts
// app/robots.ts
import { defineNextRobots } from 'react-helmet-pro/next';
export const dynamic = 'force-static';
export default defineNextRobots({
  rules: [{ userAgent: '*', allow: '/' }, { userAgent: 'Googlebot', disallow: '/private' }],
  sitemap: 'https://acme.com/sitemap.xml',
});

// app/sitemap.ts
import { defineNextSitemap } from 'react-helmet-pro/next';
export default defineNextSitemap(async () => {
  const pages = await fetchPages();
  return pages.map((p) => ({ url: p.url, lastModified: p.updatedAt, priority: 0.8 }));
});

// app/manifest.ts
import { defineNextManifest } from 'react-helmet-pro/next';
export default defineNextManifest({ name: 'Acme App', short_name: 'Acme', start_url: '/', display: 'standalone' });
```

#### Next.js Version Support Policy

| Next.js Version | Supported | Notes |
|---|---|---|
| 13 (App Router) | ✅ | `generateMetadata`, RSC, file routes |
| 14 | ✅ | Full support |
| 15 | ✅ | Full support, Turbopack compatible |
| Pages Router (`pages/`) | ✅ | Use `nextMetadataToHelmet` + `<Helmet>` |

### Add Title and Meta Tags

```tsx
import { Helmet } from 'react-helmet-pro';

<Helmet>
  <title>About Us</title>
  <meta name="description" content="Learn about our company" />
  <meta name="keywords" content="company, team, about" />
  <link rel="canonical" href="https://example.com/about" />
</Helmet>
```

You can still use the prop-based shorthand if you prefer:

```tsx
<Helmet
  title="About Us"
  meta={[{ name: 'description', content: 'Learn about our company' }]}
/>
```

### Use The High-Level SEO Helper

```tsx
import { Seo } from 'react-helmet-pro';

<Seo
  title="About Us"
  description="Learn about our company"
  canonical="https://example.com/about"
  keywords={['company', 'team', 'about']}
  openGraph={{
    title: 'About Us',
    type: 'website',
    url: 'https://example.com/about',
    images: [{ url: 'https://example.com/og/about.png', alt: 'About page preview' }],
  }}
  twitter={{
    creator: '@example',
    images: ['https://example.com/og/about.png'],
  }}
/>
```

### Validate Head Descriptors & SEO Audit API

`auditHelmetState()` is an opt-in, deterministic audit for invalid, conflicting, incomplete, or ineffective SEO metadata, Open Graph alignment, Twitter cards, robots directives, hreflang tags, image metadata, dates, structured data (JSON-LD), and URL security schemes. It accepts the reduced `HelmetState` on the client and server, performs no network requests, and returns diagnostics grouped by severity (`error`, `warning`, `suggestion`).

```tsx
import {
  HELMET_SEO_RULE_IDS,
  HELMET_SECURITY_RULE_IDS,
  auditHelmetState,
  useHelmet,
} from 'react-helmet-pro';

function HeadDiagnostics() {
  const state = useHelmet();
  const result = auditHelmetState(state, {
    context: 'seo',
    suppressions: [
      {
        ruleId: HELMET_SEO_RULE_IDS.DESCRIPTION_TOO_SHORT,
        tagName: 'meta',
      },
    ],
    severities: {
      [HELMET_SEO_RULE_IDS.TITLE_TOO_LONG]: 'warning',
    },
  });

  return result.valid
    ? null
    : <pre>{JSON.stringify(result.diagnostics, null, 2)}</pre>;
}
```

Use `onChangeClientState` to audit each committed client state. For request-local
SSR, read the un-serialized state from `HelmetData`:

```tsx
import { renderToString } from 'react-dom/server';
import { Helmet, HelmetData, auditHelmetState } from 'react-helmet-pro';

const helmetData = new HelmetData({});

renderToString(
  <Helmet helmetData={helmetData}>
    <link rel="canonical" href="https://example.com/docs" />
  </Helmet>
);

const audit = auditHelmetState(helmetData.getState(), { context: 'seo' });
```

#### Development Mode Warnings

Enable `enableDevDiagnostics` on `<HelmetProvider>` to log development warnings to the console automatically when head state updates:

```tsx
<HelmetProvider enableDevDiagnostics>
  <App />
</HelmetProvider>
```

#### Stable Diagnostic Rule IDs

Both security and SEO rule IDs are exported as stable public constants:

##### Security Rule IDs (`HELMET_SECURITY_RULE_IDS`)
| Rule ID | Meaning |
|---------|---------|
| `RHP_SECURITY_DANGEROUS_URL_SCHEME` | Obfuscated or direct `javascript:` / `vbscript:` URL |
| `RHP_SECURITY_DATA_URL` | Context-sensitive `data:` URL |
| `RHP_SECURITY_BLOB_URL` | Context-sensitive `blob:` URL |
| `RHP_SECURITY_PROTOCOL_RELATIVE_URL` | URL beginning with `//` |
| `RHP_SECURITY_CUSTOM_URL_SCHEME` | Application-specific or unknown scheme |
| `RHP_SECURITY_UNEXPECTED_URL_SCHEME` | Malformed, disallowed, or contextually ineffective scheme |
| `RHP_SECURITY_EVENT_HANDLER_ATTRIBUTE` | String `on*` event-handler attribute |
| `RHP_SECURITY_SUSPICIOUS_ATTRIBUTE_NAME` | Invalid or prototype-sensitive attribute name |

##### SEO Rule IDs (`HELMET_SEO_RULE_IDS`)
| Category | Rule ID | Meaning |
|----------|---------|---------|
| Title & Base | `RHP_SEO_TITLE_MISSING` | Page title tag is missing |
| | `RHP_SEO_TITLE_EMPTY` | Page title tag is empty |
| | `RHP_SEO_TITLE_TOO_SHORT` | Title length is under recommended minimum (<10 chars) |
| | `RHP_SEO_TITLE_TOO_LONG` | Title length is over recommended maximum (>60 chars) |
| | `RHP_SEO_TITLE_DUPLICATE` | Multiple title tags or attributes detected |
| | `RHP_SEO_BASE_MULTIPLE` | Multiple `<base>` tags detected |
| Description | `RHP_SEO_DESCRIPTION_MISSING` | Meta description tag is missing |
| | `RHP_SEO_DESCRIPTION_EMPTY` | Meta description tag is empty |
| | `RHP_SEO_DESCRIPTION_TOO_SHORT` | Description length is under recommended minimum (<50 chars) |
| | `RHP_SEO_DESCRIPTION_TOO_LONG` | Description length is over recommended maximum (>160 chars) |
| | `RHP_SEO_DESCRIPTION_DUPLICATE` | Multiple meta description tags detected |
| Canonical | `RHP_SEO_CANONICAL_MISSING` | Canonical link tag is missing |
| | `RHP_SEO_CANONICAL_INVALID_URL` | Canonical URL is relative or malformed |
| | `RHP_SEO_CANONICAL_DUPLICATE` | Multiple canonical link tags detected |
| Robots | `RHP_SEO_ROBOTS_CONFLICT` | Conflicting robots directives (e.g. `index, noindex`) |
| | `RHP_SEO_ROBOTS_DUPLICATE` | Multiple robots meta tags detected |
| | `RHP_SEO_NOINDEX_CANONICAL_CONFLICT` | Page specifies `noindex` alongside a canonical target |
| Open Graph | `RHP_SEO_OG_INCOMPLETE` | Missing recommended OG fields (`og:title`, `og:image`, etc.) |
| | `RHP_SEO_OG_DUPLICATE` | Multiple definitions for single-value OG property |
| | `RHP_SEO_OG_CANONICAL_MISMATCH` | `og:url` does not match canonical link URL |
| Twitter | `RHP_SEO_TWITTER_INCOMPLETE` | Missing required Twitter card fields |
| | `RHP_SEO_TWITTER_DUPLICATE` | Multiple definitions for single-value Twitter property |
| Hreflang | `RHP_SEO_HREFLANG_INVALID_CODE` | Invalid BCP 47 language tag |
| | `RHP_SEO_HREFLANG_INVALID_URL` | Hreflang href is relative or malformed |
| | `RHP_SEO_HREFLANG_DUPLICATE` | Duplicate hreflang tags for same language |
| | `RHP_SEO_HREFLANG_MISSING_X_DEFAULT` | Multiple hreflangs present without `x-default` fallback |
| Image | `RHP_SEO_IMAGE_ALT_MISSING` | `og:image` present without `og:image:alt` |
| | `RHP_SEO_IMAGE_INVALID_DIMENSIONS` | Invalid `og:image:width` or `og:image:height` value |
| | `RHP_SEO_IMAGE_URL_INVALID` | Image URL is invalid or relative |
| Dates | `RHP_SEO_DATE_INVALID` | Invalid ISO 8601 date string format |
| | `RHP_SEO_DATE_FUTURE` | Published date is set in the future |
| | `RHP_SEO_DATE_ORDER_INVALID` | Modified date is earlier than published date |
| JSON-LD | `RHP_SEO_JSONLD_INVALID` | Invalid JSON syntax in `<script type="application/ld+json">` |
| | `RHP_SEO_JSONLD_MISSING_CONTEXT` | JSON-LD schema missing `@context` (schema.org) |
| | `RHP_SEO_JSONLD_MISSING_TYPE` | JSON-LD schema missing `@type` declaration |

The high-level `<Seo />` and `<Favicon />` helpers omit unsafe schemes from
canonical, alternate, Open Graph, Twitter, refresh, resource, and image URLs.
Canonical and Open Graph page URLs must be absolute HTTP(S) URLs, while safe
relative resource and image URLs remain supported. The low-level `<Helmet />`
API deliberately retains raw descriptors for integrations that need them.

#### Validation Is Not Sanitization

The audit API reports policy violations; it never rewrites, escapes, or makes
untrusted input safe. `<Seo />` applies conservative URL defaults, but raw
`<Helmet />` values are still rendered using the existing serialization rules.
Audit results do not replace input validation, a Content Security Policy, trusted
URL construction, or safe handling of inline script and JSON-LD content.

### Add Homepage SEO With Site Identity Markup

```tsx
import { SiteSeo } from 'react-helmet-pro';

<SiteSeo
  title="React Helmet Pro"
  description="Modern React head management with built-in SEO helpers."
  canonical="https://reacthelmetpro.dev"
  siteName="React Helmet Pro"
  alternateSiteName={['Helmet Pro', 'RHP']}
  openGraph={{
    alternateLocale: ['de_DE'],
    images: [{ url: 'https://reacthelmetpro.dev/og/home.png', alt: 'Homepage preview' }],
  }}
  organization={{
    logo: 'https://reacthelmetpro.dev/logo.png',
    sameAs: [
      'https://github.com/opencorex-org/react-helmet-pro',
      'https://www.npmjs.com/package/react-helmet-pro',
    ],
  }}
/>
```

### Add Article SEO and Rich-Result Schema

```tsx
import { ArticleSeo, BreadcrumbJsonLd, FAQJsonLd } from 'react-helmet-pro';

<>
  <ArticleSeo
    title="Shipping SEO in React"
    description="A practical guide to richer article metadata and JSON-LD."
    canonical="https://example.com/blog/shipping-seo"
    authors={['Jane Doe']}
    publishedTime="2026-05-01T12:00:00.000Z"
    modifiedTime="2026-05-02T09:30:00.000Z"
    images={[{ url: 'https://example.com/og/article.png', alt: 'Article cover' }]}
    publisher={{ name: 'Acme', logo: 'https://example.com/logo.png' }}
    schemaType="BlogPosting"
    section="Guides"
    tags={['SEO', 'React']}
  />

  <BreadcrumbJsonLd
    items={[
      { name: 'Home', item: 'https://example.com' },
      { name: 'Blog', item: 'https://example.com/blog' },
      { name: 'Shipping SEO in React', item: 'https://example.com/blog/shipping-seo' },
    ]}
  />

  <FAQJsonLd
    entries={[
      {
        question: 'How do I add rich-result schema?',
        answer: 'Use the built-in helpers for breadcrumbs, FAQs, and article pages.',
      },
    ]}
  />
</>
```

### Add JSON-LD Structured Data

```tsx
import { StructuredData } from 'react-helmet-pro';

<StructuredData
  json={{
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'React Helmet Pro Inc.',
    url: 'https://reacthelmetpro.dev',
  }}
/>
```

For server-rendered frameworks like Next.js App Router, you can also render JSON-LD directly:

```tsx
import { JsonLdScript } from 'react-helmet-pro';

<JsonLdScript
  data={{
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Shipping SEO in Next.js',
  }}
/>
```

### Add Google Analytics

```tsx
import { Analytics } from 'react-helmet-pro';

<Analytics type="gtag" id="G-XXXXXXXXXX" />
```

---

## Middleware Example

You can define reusable middleware functions to extend or modify head data.

```ts
// middleware/withSiteSuffix.ts
export const withSiteSuffix = (head) => {
  if (head.title) {
    return { ...head, title: `${head.title} | My Awesome Site` };
  }
  return head;
};
```

Apply it in your component:

```tsx
import { useHelmetMiddleware } from 'react-helmet-pro';
import { withSiteSuffix } from './middleware/withSiteSuffix';

useHelmetMiddleware(withSiteSuffix);
```

---


## Next.js Usage

`react-helmet-pro` now supports both sides of modern Next.js SEO:

- App Router `metadata` / `generateMetadata`
- `viewport` / `generateViewport`
- metadata route files like `robots.ts`, `sitemap.ts`, and `manifest.ts`
- JSON-LD rendering for server components
- `Helmet` for metadata fields that Next.js does not model directly, such as `<base>`, `<noscript>`, custom `<script>`, and custom `<style>` tags

Use this rule of thumb:

- Use `buildNextMetadata()` for title, description, canonical URLs, Open Graph, Twitter, verification, robots, icons, alternates, app links, and web manifest URLs.
- Use `buildNextViewport()` for theme color and viewport settings.
- Use `buildNextRobots()`, `buildNextSitemap()`, and `buildNextManifest()` inside metadata route files.
- Use `JsonLdScript` for server-rendered JSON-LD.
- Use `Helmet` only for head tags the Next.js Metadata API does not support directly.

### 1. Use server-side `metadata` for primary SEO

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import { buildNextMetadata, buildNextViewport } from 'react-helmet-pro';

export const metadata: Metadata = buildNextMetadata({
  metadataBase: 'https://acme.com',
  defaultTitle: 'Acme',
  titleTemplate: '%s | Acme',
  description: 'Acme builds modern SEO tooling.',
  alternates: {
    canonical: '/',
    languages: {
      en: '/',
      de: '/de',
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Acme',
    title: 'Acme',
    description: 'Acme builds modern SEO tooling.',
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@acme',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    google: 'google-site-verification-token',
  },
});

export const viewport = buildNextViewport({
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
});
```

---

### 2. Use `generateMetadata` for dynamic SEO

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';
import { buildNextMetadata, JsonLdScript } from 'react-helmet-pro';

async function getPost(slug: string) {
  return {
    slug,
    title: 'Shipping SEO in Next.js',
    excerpt: 'How to combine metadata files, metadata exports, and JSON-LD.',
    image: `/blog/${slug}/opengraph-image.png`,
  };
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  return buildNextMetadata({
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      images: [post.image],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  return (
    <>
      <JsonLdScript
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.excerpt,
        }}
      />
      <article>{post.title}</article>
    </>
  );
}
```

---

### 3. Use metadata route files for robots, sitemap, and manifest

```tsx
// app/robots.ts
import type { MetadataRoute } from 'next';
import { buildNextRobots } from 'react-helmet-pro';

export default function robots(): MetadataRoute.Robots {
  return buildNextRobots({
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/',
    },
    sitemap: 'https://acme.com/sitemap.xml',
    host: 'https://acme.com',
  });
}
```

```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { buildNextSitemap } from 'react-helmet-pro';

export default function sitemap(): MetadataRoute.Sitemap {
  return buildNextSitemap([
    {
      url: 'https://acme.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          de: 'https://acme.com/de',
          en: 'https://acme.com',
        },
      },
      images: ['https://acme.com/opengraph-image.png'],
    },
  ]);
}
```

```tsx
// app/manifest.ts
import type { MetadataRoute } from 'next';
import { buildNextManifest } from 'react-helmet-pro';

export default function manifest(): MetadataRoute.Manifest {
  return buildNextManifest({
    name: 'Acme',
    short_name: 'Acme',
    description: 'Acme builds modern SEO tooling.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#111111',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  });
}
```

---

### 4. Use `Helmet` only for tags outside the Metadata API

Next.js does not model some head tags in `metadata`, including `<base>`, `<noscript>`, custom `<script>`, custom `<style>`, and certain resource hints. For those cases, use `Helmet` in a client component:

```tsx
// app/components/LegacyHead.tsx
'use client';

import { Helmet } from 'react-helmet-pro';

export function LegacyHead() {
  return (
    <Helmet>
      <base href="https://cdn.acme.com/" />
      <noscript>{'<link rel="stylesheet" href="/noscript.css" />'}</noscript>
      <script type="application/ld+json">
        {'{"@context":"https://schema.org","@type":"WebSite"}'}
      </script>
    </Helmet>
  );
}
```

---

### 5. Optional `HelmetProvider` usage in Next.js

Wrap the app only if you want runtime `Helmet` updates or middleware support in client components:

```tsx
// app/layout.tsx
import './globals.css';
import { HelmetProvider } from 'react-helmet-pro';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <HelmetProvider>{children}</HelmetProvider>
      </body>
    </html>
  );
}
```

---

### 6. Middleware Support in Next.js

```tsx
// client/components/HeadWrapper.tsx
'use client';

import { useHelmetMiddleware } from 'react-helmet-pro';
import { withSiteSuffix } from '../middleware/withSiteSuffix';

export default function HeadWrapper() {
  useHelmetMiddleware(withSiteSuffix);
  return null;
}
```

Use `HeadWrapper` at the top of your page/component to apply middleware.

---

### Common Gotchas in Next.js

- `metadata`, `generateMetadata`, `viewport`, and `generateViewport` are server-only in App Router.
- Prefer `metadata` / `generateMetadata` for canonical SEO fields, because they render on the server without a client boundary.
- Use `JsonLdScript` for server component JSON-LD and `StructuredData` or `Helmet` when you specifically want head management behavior.
- Use `Helmet` only for metadata the Next.js Metadata API does not support directly.
- Avoid dynamic values like `Date.now()` or `Math.random()` in client-managed head tags unless you intentionally snapshot them first.

---

## Components API

### `<Helmet />`

Supports both child tags and prop shorthand.

| Prop | Type | Description |
|------|------|-------------|
| `children` | React nodes | Use `<title>`, `<meta>`, `<link>`, `<script>`, `<style>`, `<noscript>`, `<html>`, and `<body>` child tags |
| `title` | `string` | Sets the page title |
| `meta` | `MetaTag[]` | Adds meta tags |
| `link` | `LinkTag[]` | Adds link tags |
| `script` | `ScriptTag[]` | Adds script tags, including inline JSON-LD |
| `style` | `StyleTag[]` | Adds inline style tags |
| `noscript` | `NoscriptTag[]` | Adds noscript tags |
| `base` | `BaseTag` | Adds a base tag |
| `htmlAttributes` | `Record<string, string \| boolean \| number>` | Sets attributes on `<html>` |
| `bodyAttributes` | `Record<string, string \| boolean \| number>` | Sets attributes on `<body>` |
| `titleAttributes` | `Record<string, string \| boolean \| number>` | Sets attributes on `<title>` |
| `titleTemplate` | `string` | Applies a title template like `%s \| My Site` |
| `defaultTitle` | `string` | Fallback title when no explicit title is set |
| `prioritizeSeoTags` | `boolean` | Prioritizes SEO-relevant SSR tags in `helmet.priority` |
| `defer` | `boolean` | Defers DOM updates with `requestAnimationFrame` |
| `onChangeClientState` | function | Receives `newState`, `addedTags`, and `removedTags` after client updates |
| `helmetData` | `HelmetData` | Lets you collect state outside a provider, especially for SSR |

---

### `<Seo />`

High-level SEO helper built on top of `Helmet`.

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Sets the page title |
| `description` | `string` | Standard meta description |
| `canonical` | `string` | Canonical URL |
| `keywords` | `string[]` | Keywords meta content (Google Search ignores this tag; retained for other consumers) |
| `defaultTitle` | `string` | Fallback title when no page title is provided |
| `titleTemplate` | `string` | Title template such as `%s | Site Name` |
| `author` | `string` | Author meta content |
| `locale` | `string` | Also used as `<html lang>` when no `lang` is already set |
| `siteName` | `string` | Fallback Open Graph site name |
| `alternates` | `SeoAlternateLink[]` | Hreflang and alternate links |
| `robots` | `SeoRobotsDirectives` | Builds `robots`, `googlebot`, and `googlebot-news` meta tags, including `indexifembedded` |
| `prioritizeSeoTags` | `boolean` | Places critical tags in Helmet's priority SSR output |
| `openGraph` | `SeoOpenGraph` | Open Graph tags, including article metadata and image fields |
| `twitter` | `SeoTwitter` | Twitter card tags |
| `verification` | `SeoVerification` | Search engine/site verification tags |
| `jsonLd` | `object \| object[]` | Optional JSON-LD payloads rendered as script tags |
| `extraMeta` | `MetaTag[]` | Extra meta tags to append |
| `extraLink` | `LinkTag[]` | Extra link tags to append |
| `htmlAttributes` | `HelmetAttributes` | Additional `<html>` attributes |

---

### `<SiteSeo />`

Homepage-focused helper built on top of `Seo`. It keeps page metadata aligned with `WebSite` and `Organization` JSON-LD so site names, brand identity, and social metadata stay in sync.

| Prop | Type | Description |
|------|------|-------------|
| `siteName` | `string` | Preferred site name and Open Graph site name |
| `alternateSiteName` | `string \| string[]` | Alternate site names for `WebSite` JSON-LD |
| `organization` | organization input | Optional `Organization` JSON-LD details such as `logo`, `sameAs`, `contactPoints`, and `address` |
| `webSite` | website input | Optional overrides for `WebSite` JSON-LD fields |
| `jsonLd` | `object \| object[]` | Additional JSON-LD payloads to append |
| other `Seo` props | inherited | Includes `canonical`, `description`, `keywords`, `locale`, `openGraph`, `twitter`, and more |

`SiteSeo` is especially useful on a homepage or marketing landing page where you want:

- standard title, description, canonical, Open Graph, and Twitter tags
- `WebSite` structured data for site name signals
- `Organization` structured data for logo, same-as links, and contact details

---

### `<ArticleSeo />`

Purpose-built helper for editorial pages. It renders the standard `Seo` tags, article Open Graph tags, and an Article or BlogPosting JSON-LD payload together.

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Article headline and page title |
| `authors` | `Array<string \| { name, url? }>` | Author names or linked author descriptors |
| `publishedTime` | `string` | `article:published_time` and JSON-LD publish date |
| `modifiedTime` | `string` | `article:modified_time` and JSON-LD modified date |
| `expirationTime` | `string` | Optional `article:expiration_time` |
| `images` | `SeoImage[]` | Social preview images and schema image URLs |
| `publisher` | `{ name, logo? }` | Publisher organization for JSON-LD |
| `schemaType` | `'Article' \| 'BlogPosting' \| 'NewsArticle'` | Structured data type, defaults to `Article` |
| `section` | `string` | Editorial section / category |
| `tags` | `string[]` | Article tags for Open Graph |
| `jsonLd` | `object \| object[]` | Additional JSON-LD payloads to append |
| other `Seo` props | inherited | Includes `canonical`, `description`, `keywords`, `locale`, `twitter`, `robots`, `verification`, and more |

---

### `<BreadcrumbJsonLd />`

| Prop | Type | Description |
|------|------|-------------|
| `items` | `Array<{ name: string; item: string }>` | Breadcrumb trail entries in order |
| `id` | `string` | Optional script element id |

---

### `<FAQJsonLd />`

| Prop | Type | Description |
|------|------|-------------|
| `entries` | `Array<{ question: string; answer: string }>` | FAQ question and answer pairs |
| `id` | `string` | Optional script element id |

---

### `<StructuredData />`

Client-friendly JSON-LD helper built on top of `Helmet`.

| Prop | Type | Description |
|------|------|-------------|
| `json` | `object` | JSON-LD payload |
| `id` | `string` | Optional script element id |

---

### `<JsonLdScript />`

Server-safe JSON-LD renderer for frameworks like Next.js App Router.

| Prop | Type | Description |
|------|------|-------------|
| `data` | `unknown` | JSON-LD payload |
| `type` | `string` | Optional script type, defaults to `application/ld+json` |
| `id` and other script props | native script props | Passed through to the rendered `<script>` |

---

### `<OrganizationJsonLd />`

| Prop | Type | Description |
|------|------|-------------|
| organization fields | structured data fields | Renders `Organization` JSON-LD through `StructuredData` |
| `id` | `string` | Optional script element id |

---

### `<WebSiteJsonLd />`

| Prop | Type | Description |
|------|------|-------------|
| website fields | structured data fields | Renders `WebSite` JSON-LD through `StructuredData` |
| `id` | `string` | Optional script element id |

---

## Structured Data Builders

If you want to build the schema yourself and render it through `StructuredData` or `JsonLdScript`, the package also exports:

- `buildSchema()`
- `buildWebSiteSchema()`
- `buildOrganizationSchema()`
- `buildArticleSchema()`
- `buildBreadcrumbSchema()`
- `buildFaqSchema()`

Example:

```tsx
import { JsonLdScript, buildArticleSchema } from 'react-helmet-pro';

<JsonLdScript
  data={buildArticleSchema({
    headline: 'Shipping SEO in React',
    type: 'BlogPosting',
    authors: ['Jane Doe'],
    url: 'https://example.com/blog/shipping-seo',
  })}
/>
```

---

### `<Favicon />`

| Prop | Type | Description |
|------|------|-------------|
| `href` | `string` | Path to the favicon |
| `type` | `string` | Optional MIME type |
| `sizes` | `string` | Optional icon sizes |

---

### Subresource Integrity helpers

`<ExternalScript />` and `<ExternalStylesheet />` require typed `sha256`,
`sha384`, or `sha512` integrity metadata. Both default to
`crossOrigin="anonymous"` and `referrerPolicy="no-referrer"`; override those
attributes only when the CDN requires a different request policy.

```tsx
import { ExternalScript, ExternalStylesheet } from 'react-helmet-pro';

<ExternalStylesheet
  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
  integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
/>

<ExternalScript
  defer
  src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
  integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
/>
```

Multiple hashes are supported by separating integrity expressions with
whitespace. Use `validateIntegrity()` or `isValidIntegrity()` when metadata is
loaded dynamically. Development diagnostics report malformed hashes and
cross-origin SRI descriptors that omit `crossOrigin`.

---

### `<Analytics />`

| Prop | Type | Description |
|------|------|-------------|
| `type` | `'gtag'` | Currently supports Google tag |
| `id` | `string` | Your analytics id |

---

### `<SecurityMeta />`

Injects a small set of security-oriented meta tags. The current built-in tag is:

- `<meta name="referrer" content="no-referrer" />`

---

## Developer Tooling

### CLI Audit Tool (`react-helmet-pro/cli`)

Audit rendered HTML files, static directories, or remote URLs from CI pipelines or scripts.

**Install & run:**
```bash
npx react-helmet-pro-audit --file=dist/index.html
npx react-helmet-pro-audit --url=https://example.com --format=sarif
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--file=<path>` | Audit a local HTML file |
| `--url=<url>` | Audit a remote URL (explicit opt-in, HTTPS recommended) |
| `--format=text\|json\|sarif` | Output format (default: `text`) |
| `--max-warnings=<n>` | Exit code 1 when warnings exceed this count |
| `--timeout=<ms>` | Remote fetch timeout in milliseconds (default: 5000) |

**Programmatic usage:**
```ts
import { runAudit } from 'react-helmet-pro/cli';

const result = await runAudit(['dist/index.html'], { format: 'json', maxWarnings: 0 });
process.exit(result.exitCode);
```

**SARIF output for GitHub Code Scanning:**
```yaml
# .github/workflows/seo-audit.yml
- name: SEO Audit
  run: npx react-helmet-pro-audit --file=dist/index.html --format=sarif > results.sarif

- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: results.sarif
```

> [!NOTE]
> Remote URL auditing is explicitly opt-in. Always review security implications before auditing third-party URLs in CI.

---

### ESLint Plugin (`react-helmet-pro/eslint`)

Static analysis rules for missing/conflicting metadata and unsafe JSON-LD serialization.

**ESLint v9 flat config:**
```js
// eslint.config.mjs
import reactHelmetPro from 'react-helmet-pro/eslint';

export default [
  ...reactHelmetPro.configs.recommended,
];
```

**ESLint v8 legacy config:**
```json
{
  "plugins": ["react-helmet-pro"],
  "extends": ["plugin:react-helmet-pro/recommended"]
}
```

**Rules:**

| Rule | Severity (recommended) | Description |
|------|------------------------|-------------|
| `require-title` | `warn` | Enforce `title` or `defaultTitle` on Helmet/SEO components |
| `no-duplicate-meta` | `warn` | Warn on duplicate singleton meta properties (e.g. two `og:title`) |
| `safe-json-ld` | `error` | Prevent raw template literal XSS in `<script type="application/ld+json">` |
| `require-canonical` | `off` | Recommend `canonical` prop on all SEO components |

---

### Browser Dev Inspector (`react-helmet-pro/inspector`)

A floating development panel that shows live head state, social previews, structured data, diagnostics, and navigation history.

> [!IMPORTANT]
> The inspector **throws at import time when `NODE_ENV === 'production'`**. Always wrap with a dev guard or use dynamic imports.

```tsx
import { HelmetProvider } from 'react-helmet-pro';

// Recommended: lazy load with a dev guard
const HelmetInspector =
  process.env.NODE_ENV !== 'production'
    ? React.lazy(() =>
        import('react-helmet-pro/inspector').then((m) => ({ default: m.HelmetInspector }))
      )
    : null;

export function App() {
  return (
    <HelmetProvider>
      <Routes />
      {process.env.NODE_ENV !== 'production' && HelmetInspector && (
        <React.Suspense fallback={null}>
          <HelmetInspector position="bottom-right" maxHistory={20} />
        </React.Suspense>
      )}
    </HelmetProvider>
  );
}
```

**Inspector tabs:**

| Tab | Content |
|-----|---------|
| Overview | Title, description, canonical, robots, OG type, tag counts |
| Social | Live Open Graph and Twitter card preview |
| Schema | Formatted JSON-LD structured data entities |
| Diagnostics | Live warnings and errors with rule IDs |
| History | Navigation mutation log with timestamps |

---

## SEO Testing Utilities (`react-helmet-pro/testing`)

Ensure your SEO configurations are correct without resorting to fragile CSS/DOM selectors. This subpath exports custom Vitest/Jest matchers and a stable snapshot serializer.

### Matchers

Register matchers by extending your assertion library in a setup file (e.g. `vitest.setup.ts` or `setupTests.js`):

```ts
import { expect } from 'vitest';
import { seoMatchers } from 'react-helmet-pro/testing';

expect.extend(seoMatchers);
```

Or programmatically register automatically:

```ts
import { registerMatchers } from 'react-helmet-pro/testing';
registerMatchers();
```

| Matcher | Description | Signature | Supports |
|---|---|---|---|
| `toHaveCanonical` | Asserts canonical URL presence and correctness | `expect(received).toHaveCanonical(url)` | DOM, HTML string, `HelmetState` |
| `toBeIndexable` | Asserts that robots/googlebot tags do not have `noindex` | `expect(received).toBeIndexable()` | DOM, HTML string, `HelmetState` |
| `toHaveHreflang` | Asserts localized alternate link and matching URL | `expect(received).toHaveHreflang(lang, href?)` | DOM, HTML string, `HelmetState` |
| `toHaveValidStructuredData` | Asserts parseable JSON-LD, matching type, and optional schema shape | `expect(received).toHaveValidStructuredData(type?, schema?)` | DOM, HTML string, `HelmetState` |

#### Examples:

```ts
// HTML Strings
expect(ssrHtml).toHaveCanonical('https://example.com/canonical');
expect(ssrHtml).toBeIndexable();

// Helmet State (after rewind/peek)
const state = helmetData.context.helmet;
expect(state).toHaveHreflang('es', 'https://example.com/es');

// DOM Elements
expect(document.head).toHaveValidStructuredData('Product', {
  name: 'Standard Subscription Plan',
  offers: { priceCurrency: 'USD' }
});
```

---

### Stable Snapshot Serializer

Test suites often suffer from unstable head tag order snapshots. The custom snapshot serializer sorts tags alphabetically by type, then orders them by name, property, rel, or src attributes.

Register the serializer globally in your test setup:

```ts
import { expect } from 'vitest';
import { helmetSnapshotSerializer } from 'react-helmet-pro/testing';

expect.addSnapshotSerializer(helmetSnapshotSerializer);
```

#### Deterministic Snapshot Output Example:

```ts
// Testing a chaotic head string:
const chaoticHead = `
  <link rel="canonical" href="https://example.com" />
  <meta name="description" content="Stable snapshot example" />
  <title>Deterministic Snapshot</title>
`;

expect(chaoticHead).toMatchInlineSnapshot(`
  <title>Deterministic Snapshot</title>
  <meta content="Stable snapshot example" name="description" />
  <link href="https://example.com" rel="canonical" />
`);
```

---

## Next.js Helpers


These helpers return plain objects that fit modern Next.js App Router SEO APIs.

| Export | Use for |
|--------|---------|
| `buildNextMetadata()` | `metadata` and `generateMetadata()` |
| `buildNextViewport()` | `viewport` and `generateViewport()` |
| `buildNextRobots()` | `app/robots.ts` |
| `buildNextSitemap()` | `app/sitemap.ts` |
| `buildNextManifest()` | `app/manifest.ts` |
| `safeJsonLdStringify()` | Sanitized JSON-LD serialization |

`buildNextMetadata()` covers the common SEO fields you usually need in App Router, including:

- `title`, `defaultTitle`, `titleTemplate`, and `absoluteTitle`
- `description`, `keywords`, `category`, `classification`, `referrer`
- `metadataBase`, `alternates`, `icons`, `manifest`
- `openGraph`, `twitter`, `robots`, `verification`
- `authors`, `creator`, `publisher`
- `appleWebApp`, `appLinks`, `formatDetection`, `other`

---

## Vertical SEO APIs

High-level domain-specific components synchronize HTML meta tags, Open Graph cards, canonical rules, and JSON-LD structured data from a single unified props object.

> [!NOTE]
> **Page Markup vs. Business Feeds**
> Vertical SEO components manage on-page HTML `<head>` metadata and structured data (`schema.org`) for crawler indexing and Google Rich Results. They complement—rather than replace—bulk product catalog feeds (such as Google Merchant Center XML feeds).

### Commerce (`<ProductSeo />`)

Synchronizes e-commerce product title, description, price, currency, availability, rating, reviews, shipping details, return policies, and breadcrumbs.

```tsx
import { ProductSeo } from 'react-helmet-pro';

<ProductSeo
  title="Studio Pro Wireless Headphones"
  description="High-fidelity active noise cancelling headphones."
  canonical="https://example.com/products/headphones"
  brand="AudioLab"
  sku="AL-900"
  images={[{ url: 'https://example.com/images/headphones.jpg' }]}
  offers={[
    {
      price: 249.99,
      priceCurrency: 'USD',
      availability: 'InStock',
      priceValidUntil: '2026-12-31',
    },
  ]}
  rating={{ ratingValue: 4.9, ratingCount: 210 }}
/>
```

### Local Business (`<LocalBusinessSeo />`)

Synchronizes local business metadata, geo coordinates (`geo.position`, `ICBM`), telephone, address, and opening hours.

```tsx
import { LocalBusinessSeo } from 'react-helmet-pro';

<LocalBusinessSeo
  name="Artisan Coffee Roasters"
  description="Specialty coffee roastery and cafe."
  businessType="CafeOrCoffeeShop"
  address={{
    streetAddress: "100 Market St",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    postalCode: "94105",
    addressCountry: "US",
  }}
  geo={{ latitude: 37.789, longitude: -122.401 }}
  openingHours={[
    { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "07:00", closes: "18:00" }
  ]}
/>
```

### Video (`<VideoSeo />`)

Synchronizes Open Graph video tags (`og:video`, `og:video:duration`) and `VideoObject` structured data.

```tsx
import { VideoSeo } from 'react-helmet-pro';

<VideoSeo
  title="React SSR Deep Dive"
  description="Learn advanced server-side rendering and head management."
  thumbnailUrl="https://example.com/thumb.jpg"
  contentUrl="https://example.com/video.mp4"
  uploadDate="2026-08-08"
  duration="PT18M45S"
/>
```

### Image (`<ImageSeo />`)

Synchronizes image credit, creator, copyright notice, and licensing metadata.

```tsx
import { ImageSeo } from 'react-helmet-pro';

<ImageSeo
  title="Golden Gate Sunset"
  imageUrl="https://example.com/photos/sunset.jpg"
  creditText="Photo by Jane Doe"
  creator="Jane Doe"
  license="https://creativecommons.org/licenses/by/4.0/"
/>
```

### Pagination & Infinite Scroll (`<PaginationSeo />`)

Generates `<link rel="prev">`, `<link rel="next">`, canonical page URLs, and title page numbers (`Page N of M`).

```tsx
import { PaginationSeo } from 'react-helmet-pro';

<PaginationSeo
  title="Catalog Products"
  baseUrl="https://example.com/catalog"
  currentPage={2}
  totalPages={10}
/>
```

### Paywalled Content (`<PaywalledSeo />`)

Synchronizes paywalled content markup (`isAccessibleForFree: false`) with CSS selector targets and built-in anti-cloaking diagnostic validation.

```tsx
import { PaywalledSeo } from 'react-helmet-pro';

<PaywalledSeo
  title="Exclusive Industry Analysis"
  description="In-depth research report."
  isAccessibleForFree={false}
  parts={[
    { cssSelector: ".free-summary", isAccessibleForFree: true },
    { cssSelector: ".subscriber-content", isAccessibleForFree: false },
  ]}
/>
```

---

## SSR Support


### Server-side Helmet Tag Extraction

```tsx
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-pro';

const helmetContext = {};

renderToString(
  <HelmetProvider context={helmetContext}>
    <App />
  </HelmetProvider>
);

const { helmet } = helmetContext;
```

You can also collect SSR state without a provider:

```tsx
import { Helmet, HelmetData } from 'react-helmet-pro';

const helmetData = new HelmetData({});

renderToString(
  <Helmet helmetData={helmetData}>
    <title>Standalone SSR</title>
  </Helmet>
);

const { helmet } = helmetData.context;
```

`collectHelmetTags()` can read from a provider context, a `HelmetData` instance, or an already-built server state:

```tsx
import { collectHelmetTags } from 'react-helmet-pro';

const serverHelmet = collectHelmetTags(helmetContext);
```

---

## Ecosystem Adapters & Server Middlewares

### React Router Adapter (`react-helmet-pro/react-router`)

Convert `react-helmet-pro` state or loader data into React Router (v6/v7) route metadata arrays.

```typescript
import { createReactRouterMeta, defineRouteSeo } from 'react-helmet-pro/react-router';

export const meta = createReactRouterMeta(
  defineRouteSeo(({ data }) => ({
    title: data.product.title,
    meta: [
      { name: 'description', content: data.product.description },
      { property: 'og:image', content: data.product.image },
    ],
    link: [{ rel: 'canonical', href: data.product.canonical }],
  }))
);
```

### Remix Adapter (`react-helmet-pro/remix`)

Convert `react-helmet-pro` state into Remix-compatible `meta()`, `links()`, and `headers()` export objects.

```typescript
import { toRemixMeta, toRemixLinks, toRemixHeaders } from 'react-helmet-pro/remix';

export const meta = () => toRemixMeta({
  title: 'Remix Dashboard',
  meta: [{ name: 'description', content: 'Remix app with React Helmet Pro' }],
});

export const links = () => toRemixLinks([
  { rel: 'canonical', href: 'https://example.com/dashboard' },
  { rel: 'icon', href: '/favicon.ico' },
]);

export const headers = () => toRemixHeaders({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});
```

### Astro Adapter (`react-helmet-pro/astro`)

Collect structured head tags and string representations for Astro SSR templates.

```typescript
import { collectAstroHead, renderAstroHeadToString, getAstroRobotsHeader } from 'react-helmet-pro/astro';

// Render head HTML directly into Astro template
const headHtml = renderAstroHeadToString(helmetState);

// Extract X-Robots-Tag header for Astro SSR endpoints
const headers = getAstroRobotsHeader({ index: false, follow: true });
```

### Vite SSR Adapter (`react-helmet-pro/vite-ssr`)

Inject helmet head tags and html/body attributes into Vite HTML templates or stream chunks.

```typescript
import { injectHelmetIntoHtml, createViteSsrStreamTransform } from 'react-helmet-pro/vite-ssr';

// 1. Template String Injection
const html = injectHelmetIntoHtml(indexHtmlTemplate, helmetData, {
  headPlaceholder: '<!--helmet-head-->',
  htmlAttributesPlaceholder: '<!--helmet-html-attributes-->',
  bodyAttributesPlaceholder: '<!--helmet-body-attributes-->',
});

// 2. Streaming HTML TransformStream
const stream = createViteSsrStreamTransform(helmetData, {
  flushMarker: '<!--helmet-head-flush-->',
});
```

#### Streaming Flush Behavior
When using `createViteSsrStreamTransform`, the transform stream monitors outgoing HTML chunks. Upon encountering the `flushMarker` or closing `</head>` tag, prioritized head elements (`<title>`, `<meta charset>`, `<meta name="viewport">`, resource preloads) are flushed immediately before the shell body is rendered.

### Server Runtimes & Request Isolation (`react-helmet-pro/server`)

Request-isolated middlewares for Express, Fastify, and Hono with automatic `X-Robots-Tag` header generation and error cleanup.

#### Express
```typescript
import { expressHelmetMiddleware } from 'react-helmet-pro/express';

app.use(expressHelmetMiddleware({ autoXRobotsTag: true }));

app.get('/', (req, res) => {
  const helmetData = req.helmet; // Isolated per request
  res.send('...');
});
```

#### Fastify
```typescript
import { fastifyHelmetPlugin } from 'react-helmet-pro/fastify';

fastify.register(fastifyHelmetPlugin({ autoXRobotsTag: true }));
```

#### Hono
```typescript
import { honoHelmetMiddleware } from 'react-helmet-pro/hono';

app.use('*', honoHelmetMiddleware({ autoXRobotsTag: true }));

app.get('/', (c) => {
  const helmet = c.get('helmet');
  return c.text('Hono SSR');
});
```

---

## Testing


Test with Vitest + React Testing Library.

```bash
pnpm test
```

---

## Project Health

- Contribution guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Inline content safety contract: [docs/INLINE_CONTENT_SAFETY.md](./docs/INLINE_CONTENT_SAFETY.md)
- Security policy: [SECURITY.md](./SECURITY.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

Example test:

```tsx
render(<Helmet title="Test Page" />);
expect(document.title).toBe("Test Page");
```

---

## Contributing

We welcome all contributions! To get started:

```bash
git clone https://github.com/lahiruudayakumara/react-helmet-pro.git
cd react-helmet-pro
pnpm install
pnpm run dev
```

Please open an issue or pull request if you find bugs or have feature requests.

---

## Contact

- Email: [udayakumara.wdl@gmail.com](mailto:udayakumara.wdl@gmail.com)
- Website: [https://lahiruudayakumara.com](https://lahiruudayakumara.com)

---

## Credits

Inspired by [React Helmet](https://github.com/nfl/react-helmet), but rebuilt for modern apps with middleware, SSR, and context extensibility.
