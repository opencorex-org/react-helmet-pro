import { afterEach, describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";

import { Helmet } from "../src/components/Helmet";
import { HelmetProvider } from "../src/context/HelmetProvider";
import { HelmetData } from "../src/core/HelmetData";

describe("Helmet SSR", () => {
  afterEach(() => {
    HelmetProvider.canUseDOM = true;
  });

  it("writes server state into HelmetProvider context", () => {
    HelmetProvider.canUseDOM = false;
    const context: { helmet?: ReturnType<typeof Helmet.peek> } = {};

    renderToString(
      <HelmetProvider context={context}>
        <Helmet prioritizeSeoTags>
          <html lang="en" />
          <body className="page" />
          <title>Server Title</title>
          <meta name="description" content="Server description" />
          <meta property="og:title" content="Server OG Title" />
          <link rel="canonical" href="https://example.com/server" />
          <script type="application/ld+json">{'{"@context":"https://schema.org"}'}</script>
        </Helmet>
      </HelmetProvider>,
    );

    expect(context.helmet?.title.toString()).toContain("Server Title");
    expect(context.helmet?.htmlAttributes.toString()).toContain('lang="en"');
    expect(context.helmet?.bodyAttributes.toString()).toContain('class="page"');
    expect(context.helmet?.priority.toString()).toContain('property="og:title"');
    expect(context.helmet?.priority.toString()).toContain('rel="canonical"');
    expect(context.helmet?.meta.toString()).not.toContain('property="og:title"');
    expect(context.helmet?.link.toString()).not.toContain('rel="canonical"');
  });

  it("supports standalone HelmetData without a provider", () => {
    HelmetProvider.canUseDOM = false;
    const helmetData = new HelmetData({});

    renderToString(
      <Helmet helmetData={helmetData}>
        <title>Standalone Title</title>
        <meta name="description" content="Standalone description" />
      </Helmet>,
    );

    expect(helmetData.context.helmet?.title.toString()).toContain("Standalone Title");
    expect(helmetData.context.helmet?.meta.toString()).toContain('name="description"');
  });

  it("keeps static renderStatic compatibility for non-provider usage", () => {
    HelmetProvider.canUseDOM = false;

    renderToString(
      <Helmet>
        <title>Static Title</title>
      </Helmet>,
    );

    const state = Helmet.renderStatic();
    expect(state.title.toString()).toContain("Static Title");
    expect(Helmet.peek().title.toString()).toBe("");
  });
});
