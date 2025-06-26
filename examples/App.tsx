import {
  Analytics,
  Favicon,
  Helmet,
  HelmetProvider,
  SecurityMeta,
  StructuredData,
  appendSiteName,
  buildSchema,
  injectLocale,
  mergeHelmet,
  useHelmet,
  useHelmetMiddleware,
} from "react-helmet-pro";
import React, { useEffect, useMemo, useState } from "react";

const deepEqual = (a: any, b: any): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <HeadContent />
    </HelmetProvider>
  );
};

const HeadContent: React.FC = () => {
  const { setHead, title, meta, link } = useHelmet();
  const [prevHead, setPrevHead] = useState<any>(null);

  useHelmetMiddleware(appendSiteName, [title, meta]);
  useHelmetMiddleware((head) => injectLocale(head, "en"), [title, meta]);

  const structuredData = buildSchema("WebPage", {
    name: "Example WebPage",
    description: "This is an example webpage with dynamic metadata.",
  });

  const mergedHead = useMemo(() => {
    return mergeHelmet(
      { title, meta, link },
      {
        title: "Home | React Helmet Pro Example",
        meta: [
          { name: "description", content: "This is the home page." },
          { property: "og:title", content: "Home | React Helmet Pro Example" },
          { property: "og:description", content: "This is the home page." },
          { property: "og:type", content: "website" },
          { property: "og:image", content: "https://example.com/image.jpg" },
          { property: "twitter:card", content: "summary_large_image" },
          { property: "twitter:title", content: "Home | React Helmet Pro Example" },
          {
            property: "twitter:description",
            content: "This is the home page.",
          },
          {
            property: "twitter:image",
            content: "https://example.com/image.jpg",
          },
          { name: "viewport", content: "width=device-width, initial-scale=1" },
          { name: "author", content: "Your Name" },
        ],
        link: [
          { rel: "canonical", href: "https://example.com" },
          {
            rel: "stylesheet",
            href: "https://fonts.googleapis.com/css?family=Roboto&display=swap",
          },
        ],
      }
    );
  }, [title, meta, link]);

  useEffect(() => {
    if (!deepEqual(mergedHead, prevHead)) {
      setHead?.(mergedHead);
      setPrevHead(mergedHead);
    }
  }, [mergedHead, prevHead, setHead]);

  return (
    <>
      <Favicon href="assets/logo.png" />
      <Helmet title={title} meta={meta} link={link} />
      <StructuredData json={structuredData} />
      <SecurityMeta />
      <div style={{ textAlign: "center", padding: "20px" }}>
        <img src="assets/logo.png" style={{ width: "300px" }} alt="Logo" />
        <h1>Welcome to the Example | React Helmet Pro Example</h1>
        <p>This app demonstrates how to use dynamic head management.</p>
        <p>Enjoy exploring the features!</p>
      </div>
    </>
  );
};

export default App;
