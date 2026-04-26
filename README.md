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
- `htmlAttributes`, `bodyAttributes`, and `titleAttributes`
- `titleTemplate`, `defaultTitle`, `defer`, and `onChangeClientState`
- `Helmet.renderStatic()`, `Helmet.peek()`, and `HelmetData`
- SEO tag prioritization for SSR via `prioritizeSeoTags`
- Next.js App Router helpers for `metadata`, `viewport`, `robots.ts`, `sitemap.ts`, and `manifest.ts`
- JSON-LD Structured Data support
- Google Analytics integration
- Favicons & SEO helpers
- Security meta tags (CSP, nosniff, etc.)
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
| Analytics helper component | Yes | No | No | No |
| Security meta helper component | Yes | No | No | Partial |
| Middleware hook for reusable head transforms | Yes | No | No | No |
| Built-in helper for reading live Helmet state | Yes | No | No | No |
| `<base>`, `<noscript>`, inline `<script>`, inline `<style>` support through a Helmet API | Yes | Yes | Yes | No in metadata config |

If you are using App Router, Next.js itself is the best fit for canonical SEO fields like title, description, Open Graph, Twitter cards, robots, sitemap, and manifest. `react-helmet-pro` is meant to complement that with helper builders, JSON-LD helpers, and a Helmet API for the head tags the Metadata API does not model directly.

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

### `<Favicon />`

| Prop | Type | Description |
|------|------|-------------|
| `href` | `string` | Path to the favicon |
| `type` | `string` | Optional MIME type |
| `sizes` | `string` | Optional icon sizes |

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

## Testing

Test with Vitest + React Testing Library.

```bash
pnpm test
```

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
