## React Helmet Pro

[![npm version](https://img.shields.io/npm/v/react-helmet-pro.svg)](https://www.npmjs.com/package/react-helmet-pro)
[![License](https://img.shields.io/github/license/opencorex-org/react-helmet-pro)](LICENSE)
[![Build Status](https://github.com/lahiruudayakumara/react-helmet-pro/actions/workflows/build.yml/badge.svg)](https://github.com/lahiruudayakumara/react-helmet-pro/actions)
[![npm downloads](https://img.shields.io/npm/dm/react-helmet-pro.svg)](https://www.npmjs.com/package/react-helmet-pro)
[![GitHub stars](https://img.shields.io/github/stars/opencorex-org/react-helmet-pro?style=social)](https://github.com/opencorex-org/react-helmet-pro)
[![GitHub issues](https://img.shields.io/github/issues/opencorex-org/react-helmet-pro)](https://github.com/opencorex-org/react-helmet-pro/issues)
[![Code Coverage](https://img.shields.io/codecov/c/github/lahiruudayakumara/react-helmet-pro)](https://codecov.io/gh/opencorex-org/react-helmet-pro)

**React Helmet Pro** is an advanced, modular, and SSR compatible head manager for React applications. It provides a clean and powerful API for dynamically managing `<title>`, `<meta>`, `<link>`, `<script>`, structured data, favicons, analytics, and security headers designed for real world production use.

> Robust head management for SEO, analytics, and SSR made simple.

---

## Features

- Dynamic `<title>`, `<meta>`, `<link>`, `<script>` injection
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
# or with npm
npm install react-helmet-pro
# with pnpm
pnpm add react-helmet-pro
# or with yarn
yarn add react-helmet-pro
```

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

<Helmet
  title="About Us"
  meta={[
    { name: 'description', content: 'Learn about our company' },
    { name: 'keywords', content: 'company, team, about' },
  ]}
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

`react-helmet-pro` works seamlessly with **Next.js**, including full support for **Server Side Rendering (SSR)** and **App Router**. Follow these steps to integrate it:

### 1. Setup in `app/layout.tsx`

Wrap your app in the `HelmetProvider`:

```tsx
// app/layout.tsx (App Router)
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

> 💡 Note: `HelmetProvider` must be used inside the `<body>` tag, not the `<head>` in App Router.

---

### 2. Use `<Helmet />` in any component

```tsx
// app/about/page.tsx or any client component
'use client';

import { Helmet } from 'react-helmet-pro';

export default function AboutPage() {
  return (
    <>
      <Helmet
        title="About Us"
        meta={[
          { name: 'description', content: 'Learn about our company' },
          { name: 'keywords', content: 'company, team, about' },
        ]}
      />
      <h1>About Us</h1>
    </>
  );
}
```

---

### 3. Enable SSR Head Tag Extraction (Optional)

If you are using **custom SSR setup** with `getServerSideProps` or want finer control, you can extract head tags server-side:

```tsx
// In custom _document.tsx for SSR
import Document, { Html, Head, Main, NextScript } from 'next/document';
import { collectHelmetTags } from 'react-helmet-pro';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const helmetTags = collectHelmetTags(/* your Helmet elements */);

    return {
      ...initialProps,
      helmetTags,
    };
  }

  render() {
    // Inject head tags here if extracted manually
    return (
      <Html>
        <Head>
          {/* SSR extracted tags can go here if needed */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
```

---

### 4. Middleware Support in Next.js

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

Use `HelmetWrapper` at the top of your page/component to apply middleware.

---

### Common Gotchas in Next.js

- **Hydration Mismatch Warning**: Avoid using dynamic data like `Date.now()` or `Math.random()` in head tags without guards (`typeof window !== 'undefined'`) or snapshotting.
- Always mark `Helmet` and `StructuredData` usage in `use client` components.

---

## Components API

### `<Helmet />`

| Prop   | Type                        | Description              |
|--------|-----------------------------|--------------------------|
| title  | `string`                    | Sets the page title      |
| meta   | `Array<{ name: string; content: string }>` | Injects meta tags |

---

### `<StructuredData />`

| Prop | Type     | Description              |
|------|----------|--------------------------|
| json | `object` | JSON-LD structured data  |

---

### `<Favicon />`

| Prop | Type     | Description         |
|------|----------|---------------------|
| href | `string` | Path to favicon.ico |

---

### `<Analytics />`

| Prop | Type         | Description               |
|------|--------------|---------------------------|
| type | `'gtag'`     | Currently only supports GTag |
| id   | `string`     | Your Google Analytics ID  |

---

### `<SecurityMeta />`

Injects security-related meta tags like CSP, XSS protection, nosniff headers, etc.

---

## SSR Support

### Server-side Helmet Tag Extraction

```tsx
import { collectHelmetTags } from 'react-helmet-pro';

const headTags = collectHelmetTags(/* JSX head elements */);
// Use this to inject into SSR-rendered HTML
```

---

## Testing

Test with Jest + React Testing Library.

```bash
npm run test
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

- Email: [lahiruudayakumara.info@gmail.com](mailto:udayakumara.wdl@gmail.com)
- Website: [https://lahiruudayakumara.me](https://lahiruudayakumara.com)

---

## Credits

Inspired by [React Helmet](https://github.com/nfl/react-helmet), but rebuilt for modern apps with middleware, SSR, and context extensibility.
