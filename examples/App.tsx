import {
  Favicon,
  Helmet,
  HelmetProvider,
  JsonLdScript,
  SecurityMeta,
  StructuredData,
  buildNextManifest,
  buildNextMetadata,
  buildNextRobots,
  buildNextSitemap,
  buildNextViewport,
  buildSchema,
  injectLocale,
  safeJsonLdStringify,
  useHelmet,
  useHelmetMiddleware,
} from "react-helmet-pro";
import React, { startTransition, useMemo, useState } from "react";

type DemoPageKey = "home" | "docs" | "pricing";
type DemoLocale = "en" | "de";

const pageContent: Record<
  DemoPageKey,
  {
    accent: string;
    canonical: string;
    description: string;
    eyebrow: string;
    image: string;
    keywords: string[];
    title: string;
  }
> = {
  docs: {
    accent: "#4da6ff",
    canonical: "",
    description: "See the child-tag API, middleware flow, SSR helpers, and Next.js integrations in one place.",
    eyebrow: "Documentation Demo",
    image: "https://reacthelmetpro.dev/og/docs.png",
    keywords: ["react helmet", "ssr", "metadata", "next.js"],
    title: "Documentation",
  },
  home: {
    accent: "#ff7a18",
    canonical: "",
    description: "Explore live head updates, JSON-LD helpers, and modern SEO utilities from one small demo app.",
    eyebrow: "Live Head Playground",
    image: "https://reacthelmetpro.dev/og/home.png",
    keywords: ["react", "helmet", "seo", "structured data"],
    title: "Home",
  },
  pricing: {
    accent: "#2ec27e",
    canonical: "",
    description: "Preview product pages, social metadata, and metadata route output before wiring them into a real app.",
    eyebrow: "Product Page Demo",
    image: "https://reacthelmetpro.dev/og/pricing.png",
    keywords: ["pricing page", "open graph", "twitter cards", "robots"],
    title: "Pricing",
  },
};

const localeLabels: Record<DemoLocale, string> = {
  de: "Deutsch",
  en: "English",
};

const prettyJson = (value: unknown) =>
  JSON.stringify(
    value,
    (_key, currentValue) => (currentValue instanceof URL ? currentValue.toString() : currentValue),
    2,
  );

const pageButtonStyle = (active: boolean, accent: string): React.CSSProperties => ({
  background: active ? accent : "rgba(255,255,255,0.08)",
  border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.14)",
  borderRadius: 999,
  color: active ? "#121212" : "#f7f2ea",
  cursor: "pointer",
  fontFamily: '"Space Grotesk", sans-serif',
  fontSize: 14,
  fontWeight: 700,
  padding: "10px 16px",
  transition: "all 160ms ease",
});

const cardStyle: React.CSSProperties = {
  background: "rgba(13, 18, 32, 0.78)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 24,
  boxShadow: "0 24px 90px rgba(0, 0, 0, 0.28)",
  padding: 24,
};

const preStyle: React.CSSProperties = {
  background: "rgba(5, 9, 20, 0.78)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  color: "#d4def5",
  fontFamily: '"IBM Plex Mono", monospace',
  fontSize: 12,
  lineHeight: 1.6,
  margin: 0,
  overflowX: "auto",
  padding: 18,
  whiteSpace: "pre-wrap",
};

const App: React.FC = () => (
  <HelmetProvider>
    <ExamplePlayground />
  </HelmetProvider>
);

const ExamplePlayground: React.FC = () => {
  const [pageKey, setPageKey] = useState<DemoPageKey>("home");
  const [locale, setLocale] = useState<DemoLocale>("en");
  const [changeLog, setChangeLog] = useState<string[]>([]);
  const page = pageContent[pageKey];
  const helmet = useHelmet();

  useHelmetMiddleware((head) => {
    let nextHead: Record<string, unknown> = head as unknown as Record<string, unknown>;
    const currentHead = nextHead as unknown as typeof head;

    if (currentHead.htmlAttributes?.lang !== locale) {
      nextHead = {
        ...currentHead,
        htmlAttributes: {
          ...(currentHead.htmlAttributes ?? {}),
          lang: locale,
        },
      };
    }

    const nextHeadWithHtml = nextHead as unknown as typeof head;
    const hasLocaleMeta = nextHeadWithHtml.meta?.some(
      (tag) => tag.name === "language" && tag.content === locale,
    );

    if (!hasLocaleMeta) {
      nextHead = injectLocale(nextHeadWithHtml, locale) as Record<string, unknown>;
    }

    return nextHead;
  }, [locale, pageKey]);

  const clientStructuredData = useMemo(
    () =>
      buildSchema("WebPage", {
        description: page.description,
        inLanguage: locale,
        name: `${page.title} Demo`,
        url: page.canonical,
      }),
    [locale, page],
  );

  const serverStructuredData = useMemo(
    () =>
      buildSchema("Article", {
        description: `${page.description} This preview mirrors how JsonLdScript would be used in a server component.`,
        headline: `${page.title} SEO Preview`,
        inLanguage: locale,
        url: page.canonical,
      }),
    [locale, page],
  );

  const nextMetadataPreview = useMemo(
    () =>
      buildNextMetadata({
        alternates: {
          canonical: page.canonical,
          languages: {
            de: page.canonical.replace(".dev", ".dev/de-demo"),
            en: page.canonical,
          },
        },
        appleWebApp: {
          capable: true,
          title: `Helmet Pro ${page.title}`,
        },
        description: page.description,
        icons: {
          apple: ["/apple-touch-icon.png"],
          icon: ["/icon.png", { sizes: "any", type: "image/svg+xml", url: "/icon.svg" }],
        },
        keywords: page.keywords,
        metadataBase: "https://reacthelmetpro.dev",
        openGraph: {
          description: page.description,
          images: [page.image],
          siteName: "React Helmet Pro",
          title: `${page.title} Example`,
          type: "website",
          url: page.canonical,
        },
        robots: {
          follow: true,
          googleBot: {
            follow: true,
            index: true,
            "max-image-preview": "large",
          },
          index: true,
        },
        title: page.title,
        titleTemplate: "%s | React Helmet Pro",
        twitter: {
          card: "summary_large_image",
          creator: "@reacthelmetpro",
          description: page.description,
          images: [page.image],
          title: `${page.title} Example`,
        },
        verification: {
          google: "demo-google-site-verification",
        },
      }),
    [page],
  );

  const nextViewportPreview = useMemo(
    () =>
      buildNextViewport({
        colorScheme: "light dark",
        initialScale: 1,
        themeColor: [
          { color: "#fff8ef", media: "(prefers-color-scheme: light)" },
          { color: "#0c1224", media: "(prefers-color-scheme: dark)" },
        ],
        width: "device-width",
      }),
    [],
  );

  const nextRobotsPreview = useMemo(
    () =>
      buildNextRobots({
        host: "https://reacthelmetpro.dev",
        rules: [
          {
            allow: "/",
            userAgent: "*",
          },
          {
            disallow: ["/preview-only"],
            userAgent: "Googlebot",
          },
        ],
        sitemap: "https://reacthelmetpro.dev/sitemap.xml",
      }),
    [],
  );

  const nextSitemapPreview = useMemo(
    () =>
      buildNextSitemap([
        {
          alternates: {
            languages: {
              de: `${page.canonical}?lang=de`,
              en: `${page.canonical}?lang=en`,
            },
          },
          changeFrequency: "weekly",
          images: [page.image],
          lastModified: "2026-04-27",
          priority: pageKey === "home" ? 1 : 0.8,
          url: page.canonical,
        },
      ]),
    [page, pageKey],
  );

  const nextManifestPreview = useMemo(
    () =>
      buildNextManifest({
        background_color: "#0c1224",
        description: "A small playground for modern React and Next.js SEO patterns.",
        display: "standalone",
        icons: [
          {
            sizes: "192x192",
            src: "/icon-192.png",
            type: "image/png",
          },
        ],
        name: "React Helmet Pro Playground",
        short_name: "Helmet Pro",
        start_url: "/",
        theme_color: "#ff7a18",
      }),
    [],
  );

  const liveHelmetPreview = useMemo(
    () => ({
      bodyAttributes: helmet.bodyAttributes,
      htmlAttributes: helmet.htmlAttributes,
      link: helmet.link,
      meta: helmet.meta,
      script: helmet.script,
      title: helmet.title,
    }),
    [helmet.bodyAttributes, helmet.htmlAttributes, helmet.link, helmet.meta, helmet.script, helmet.title],
  );

  return (
    <>
      <Favicon href="assets/logo.png" />
      <SecurityMeta />

      <Helmet
        defaultTitle="React Helmet Pro Playground"
        prioritizeSeoTags
        onChangeClientState={(newState) => {
          const nextEntry = `${locale.toUpperCase()} -> ${newState.title ?? "(untitled)"}`;
          setChangeLog((previous) =>
            previous[0] === nextEntry ? previous : [nextEntry, ...previous].slice(0, 5),
          );
        }}
      >
        <html data-demo-page={pageKey} />
        <body data-locale={locale} />
        <title>{`${page.title} Example`}</title>
        <meta name="description" content={page.description} />
        <meta name="keywords" content={page.keywords.join(", ")} />
        <meta property="og:title" content={`${page.title} Example`} />
        <meta property="og:description" content={page.description} />
        <meta property="og:image" content={page.image} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${page.title} Example`} />
        <meta name="twitter:description" content={page.description} />
        <link rel="canonical" href={page.canonical} />
      </Helmet>

      <Helmet
        link={[
          {
            href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Space+Grotesk:wght@400;500;700&display=swap",
            rel: "stylesheet",
          },
          {
            href: "https://fonts.gstatic.com",
            rel: "preconnect",
          },
        ]}
        script={[
          {
            innerHTML: `window.__RHP_DEMO__ = { page: "${pageKey}", locale: "${locale}" };`,
            type: "text/javascript",
          },
        ]}
      />

      <StructuredData json={clientStructuredData} />

      <div hidden>
        <JsonLdScript id="server-jsonld-preview" data={serverStructuredData} />
      </div>

      <main
        style={{
          background:
            "radial-gradient(circle at top left, rgba(255,122,24,0.22), transparent 32%), radial-gradient(circle at 85% 20%, rgba(77,166,255,0.16), transparent 28%), linear-gradient(180deg, #10172d 0%, #090d18 100%)",
          color: "#f7f2ea",
          fontFamily: '"Space Grotesk", sans-serif',
          minHeight: "100vh",
          padding: "40px 20px 80px",
        }}
      >
        <div style={{ margin: "0 auto", maxWidth: 1180 }}>
          <section
            style={{
              ...cardStyle,
              overflow: "hidden",
              position: "relative",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                background: `radial-gradient(circle at top right, ${page.accent}55, transparent 38%)`,
                inset: 0,
                pointerEvents: "none",
                position: "absolute",
              }}
            />
            <div
              style={{
                display: "grid",
                gap: 24,
                gridTemplateColumns: "minmax(0, 1.4fr) minmax(320px, 0.9fr)",
                position: "relative",
              }}
            >
              <div>
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    gap: 14,
                    marginBottom: 20,
                  }}
                >
                  <img
                    alt="React Helmet Pro logo"
                    src="assets/logo.png"
                    style={{
                      borderRadius: 18,
                      boxShadow: "0 14px 36px rgba(0, 0, 0, 0.24)",
                      width: 72,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        color: "#ffd4b3",
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: 12,
                        letterSpacing: 1.1,
                        textTransform: "uppercase",
                      }}
                    >
                      {page.eyebrow}
                    </div>
                    <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 4rem)", margin: "8px 0 0" }}>
                      React Helmet Pro examples, updated for the new API surface
                    </h1>
                  </div>
                </div>

                <p
                  style={{
                    color: "#c6d0ea",
                    fontSize: 18,
                    lineHeight: 1.7,
                    marginBottom: 24,
                    maxWidth: 720,
                  }}
                >
                  Switch pages and locales to watch the document title, meta tags, structured data,
                  middleware-injected language tags, and Next.js helper output all change together.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
                  {(Object.keys(pageContent) as DemoPageKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => startTransition(() => setPageKey(key))}
                      style={pageButtonStyle(pageKey === key, page.accent)}
                      type="button"
                    >
                      {pageContent[key].title}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {(Object.keys(localeLabels) as DemoLocale[]).map((currentLocale) => (
                    <button
                      key={currentLocale}
                      onClick={() => startTransition(() => setLocale(currentLocale))}
                      style={pageButtonStyle(locale === currentLocale, "#f0d264")}
                      type="button"
                    >
                      {localeLabels[currentLocale]}
                    </button>
                  ))}
                </div>
              </div>

              <aside
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 20,
                  padding: 20,
                }}
              >
                <div style={{ color: "#ffd4b3", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>
                  Live page summary
                </div>
                <h2 style={{ fontSize: 28, margin: "12px 0 8px" }}>{page.title}</h2>
                <p style={{ color: "#c6d0ea", lineHeight: 1.7, marginTop: 0 }}>{page.description}</p>
                <dl
                  style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "auto 1fr",
                    margin: 0,
                  }}
                >
                  <dt style={{ color: "#93a3c8" }}>Locale</dt>
                  <dd style={{ margin: 0 }}>{localeLabels[locale]}</dd>
                  <dt style={{ color: "#93a3c8" }}>Canonical</dt>
                  <dd style={{ margin: 0, wordBreak: "break-word" }}>{page.canonical}</dd>
                  <dt style={{ color: "#93a3c8" }}>Structured data</dt>
                  <dd style={{ margin: 0 }}>Client + server preview included</dd>
                </dl>
              </aside>
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gap: 24,
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              marginBottom: 24,
            }}
          >
            <article style={cardStyle}>
              <div style={{ color: "#ffd4b3", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>
                Live Helmet state
              </div>
              <h2 style={{ fontSize: 26, margin: "10px 0 18px" }}>What the provider sees right now</h2>
              <pre style={preStyle}>{prettyJson(liveHelmetPreview)}</pre>
            </article>

            <article style={cardStyle}>
              <div style={{ color: "#ffd4b3", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>
                Client update log
              </div>
              <h2 style={{ fontSize: 26, margin: "10px 0 18px" }}>Changes from `onChangeClientState`</h2>
              <ul style={{ display: "grid", gap: 10, listStyle: "none", margin: 0, padding: 0 }}>
                {changeLog.length ? (
                  changeLog.map((entry) => (
                    <li
                      key={entry}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 14,
                        color: "#d4def5",
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: 13,
                        padding: "12px 14px",
                      }}
                    >
                      {entry}
                    </li>
                  ))
                ) : (
                  <li style={{ color: "#93a3c8" }}>Change events will appear here after the first update.</li>
                )}
              </ul>
            </article>
          </section>

          <section
            style={{
              display: "grid",
              gap: 24,
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            }}
          >
            <article style={cardStyle}>
              <h2 style={{ fontSize: 24, marginTop: 0 }}>Next.js `metadata` + `viewport` preview</h2>
              <p style={{ color: "#c6d0ea", lineHeight: 1.7 }}>
                These objects come from the new helper builders and can be returned directly from
                App Router exports.
              </p>
              <pre style={{ ...preStyle, marginBottom: 16 }}>{prettyJson(nextMetadataPreview)}</pre>
              <pre style={preStyle}>{prettyJson(nextViewportPreview)}</pre>
            </article>

            <article style={cardStyle}>
              <h2 style={{ fontSize: 24, marginTop: 0 }}>Metadata route helper preview</h2>
              <p style={{ color: "#c6d0ea", lineHeight: 1.7 }}>
                The same example page also generates preview objects for `robots.ts`, `sitemap.ts`,
                and `manifest.ts`.
              </p>
              <pre style={{ ...preStyle, marginBottom: 16 }}>{prettyJson(nextRobotsPreview)}</pre>
              <pre style={{ ...preStyle, marginBottom: 16 }}>{prettyJson(nextSitemapPreview)}</pre>
              <pre style={preStyle}>{prettyJson(nextManifestPreview)}</pre>
            </article>

            <article style={cardStyle}>
              <h2 style={{ fontSize: 24, marginTop: 0 }}>JSON-LD helper preview</h2>
              <p style={{ color: "#c6d0ea", lineHeight: 1.7 }}>
                `StructuredData` mounts the client-managed script tag, while `JsonLdScript` gives
                you a server-safe component for frameworks like Next.js.
              </p>
              <pre style={{ ...preStyle, marginBottom: 16 }}>{prettyJson(clientStructuredData)}</pre>
              <pre style={preStyle}>{safeJsonLdStringify(serverStructuredData)}</pre>
            </article>
          </section>
        </div>
      </main>
    </>
  );
};

export default App;
