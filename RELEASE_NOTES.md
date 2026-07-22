# Release Notes

This file summarizes the current branch changes and can be used as the release body for the next GitHub release.

## What's Changed

### React Helmet and SSR compatibility

- Expanded `Helmet` to cover the familiar `react-helmet` and `react-helmet-async` feature surface.
- Added support for child-tag usage with `<title>`, `<base>`, `<meta>`, `<link>`, `<script>`, `<style>`, and `<noscript>`.
- Added advanced head-management features including `htmlAttributes`, `bodyAttributes`, `titleAttributes`, `titleTemplate`, `defaultTitle`, `defer`, and `onChangeClientState`.
- Added SSR-focused APIs such as `Helmet.renderStatic()`, `Helmet.peek()`, `HelmetData`, and improved server-state collection utilities.
- Added SEO tag prioritization support for SSR output.

### Next.js SEO support

- Added helper builders for modern Next.js App Router metadata workflows:
  - `buildNextMetadata()`
  - `buildNextViewport()`
  - `buildNextRobots()`
  - `buildNextSitemap()`
  - `buildNextManifest()`
- Added `JsonLdScript` for server-safe JSON-LD rendering in frameworks like Next.js.
- Updated structured data handling to use sanitized JSON-LD output.

### Higher-level SEO helpers

- Added the high-level `Seo` component for common SEO tags such as title, description, canonical URLs, robots directives, Open Graph, Twitter cards, alternate links, verification tags, and JSON-LD.
- Added `ArticleSeo` for editorial pages with synchronized article metadata, article Open Graph tags, and Article or BlogPosting JSON-LD.
- Added `SiteSeo` for homepage and brand pages so page metadata, site-name signals, and organization identity markup stay aligned.
- Added support for multilingual Open Graph alternates through `og:locale:alternate`.

### Structured data and rich results

- Added `OrganizationJsonLd` and `WebSiteJsonLd` components for site-level entity markup.
- Added `BreadcrumbJsonLd` and `FAQJsonLd` components for supported rich-result markup.
- Expanded schema utilities with:
  - `buildOrganizationSchema()`
  - `buildWebSiteSchema()`
  - `buildArticleSchema()`
  - `buildBreadcrumbSchema()`
  - `buildFaqSchema()`
- Improved site identity support with `WebSite` and `Organization` JSON-LD patterns aligned to current Google Search guidance.

### Examples, docs, and comparisons

- Refreshed the example app to demonstrate `Seo`, `SiteSeo`, `ArticleSeo`, rich-result helpers, live Helmet state, and Next.js metadata helper output.
- Updated the README with new installation guidance, SSR usage, Next.js examples, homepage/site-identity SEO examples, and structured data builder docs.
- Added a feature comparison table covering `react-helmet-pro`, `react-helmet`, `react-helmet-async`, and the Next.js Metadata API.

### Tests and quality

- Added and expanded tests for:
  - SEO metadata output
  - article SEO behavior
  - site-level SEO behavior
  - structured data and rich-result helpers
  - SSR and Next.js helper behavior
- Verified the package and example app with typechecking and test coverage.

### GitHub automation and repository health

- Hardened GitHub Actions workflows with:
  - CI matrix coverage for Node.js `18`, `20`, and `22`
  - pnpm setup and caching
  - frozen lockfile installs
  - workflow concurrency control
  - least-privilege workflow permissions
  - npm provenance publishing
- Reworked release automation so GitHub releases use real generated notes instead of the placeholder `Automated release for version ...`.
- Added a release-note generator script for workflow-driven GitHub releases.
- Added repository health files and contributor guidance:
  - `CODEOWNERS`
  - issue templates
  - PR template
  - `CONTRIBUTING.md`
  - `SECURITY.md`
  - `CODE_OF_CONDUCT.md`
  - Dependabot configuration

## Validation

- `pnpm exec tsc --noEmit`
- `pnpm exec tsc --noEmit -p examples/tsconfig.json`
- `pnpm test`
- `pnpm run release:notes`
