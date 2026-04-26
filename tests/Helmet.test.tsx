import "@testing-library/jest-dom";

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";

import { Helmet } from "../src/components/Helmet";
import { HelmetContext } from "../src/context/HelmetContext";
import { HelmetProvider } from "../src/context/HelmetProvider";

const resetDocument = () => {
  document.title = "";
  document.head.innerHTML = "";
  document.documentElement.removeAttribute("lang");
  document.documentElement.removeAttribute("amp");
  document.body.removeAttribute("class");
  document.body.removeAttribute("data-page");
};

describe("Helmet", () => {
  afterEach(() => {
    cleanup();
    resetDocument();
  });

  it("supports prop-based title and meta updates", async () => {
    render(
      <HelmetProvider>
        <Helmet
          title="Test Title"
          meta={[
            { name: "description", content: "Test Description" },
            { name: "keywords", content: "test, vitest" },
          ]}
        />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(document.title).toBe("Test Title");
    });

    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      "Test Description",
    );
    expect(document.querySelector('meta[name="keywords"]')).toHaveAttribute(
      "content",
      "test, vitest",
    );
  });

  it("supports child tags and document attributes", async () => {
    render(
      <HelmetProvider>
        <Helmet>
          <html lang="en" amp />
          <body className="root" data-page="home" />
          <title itemProp="name">Nested Title</title>
          <meta property="og:title" content="Nested component" />
          <link rel="canonical" href="https://example.com/about" />
        </Helmet>
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(document.title).toBe("Nested Title");
    });

    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(document.documentElement).toHaveAttribute("amp");
    expect(document.body).toHaveAttribute("class", "root");
    expect(document.body).toHaveAttribute("data-page", "home");
    expect(document.querySelector("title")).toHaveAttribute("itemprop", "name");
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Nested component",
    );
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://example.com/about",
    );
  });

  it("applies titleTemplate and defaultTitle", async () => {
    const { rerender } = render(
      <HelmetProvider>
        <Helmet defaultTitle="Fallback Title" titleTemplate="%s | My Site" />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(document.title).toBe("Fallback Title");
    });

    rerender(
      <HelmetProvider>
        <Helmet defaultTitle="Fallback Title" titleTemplate="%s | My Site" />
        <Helmet title="About" />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(document.title).toBe("About | My Site");
    });
  });

  it("lets later Helmet instances override duplicate tags", async () => {
    render(
      <HelmetProvider>
        <Helmet title="Parent" meta={[{ name: "description", content: "Parent description" }]} />
        <Helmet title="Child" meta={[{ name: "description", content: "Child description" }]} />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(document.title).toBe("Child");
    });

    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      "Child description",
    );
  });

  it("removes managed tags on unmount", async () => {
    const { unmount } = render(
      <HelmetProvider>
        <Helmet meta={[{ name: "description", content: "Unmount me" }]} />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(document.querySelector('meta[name="description"]')).not.toBeNull();
    });

    unmount();

    await waitFor(() => {
      expect(document.querySelector('meta[name="description"]')).toBeNull();
    });
  });

  it("keeps the legacy setHead callback path for manual context usage", async () => {
    const setHeadSpy = vi.fn();

    render(
      <HelmetContext.Provider
        value={
          {
            base: [],
            bodyAttributes: {},
            defer: true,
            encodeSpecialCharacters: true,
            htmlAttributes: {},
            link: [],
            meta: [],
            noscript: [],
            setHead: setHeadSpy,
            style: [],
            script: [],
            titleAttributes: {},
          } as never
        }
      >
        <Helmet title="Legacy Context Title" meta={[{ name: "description", content: "Legacy" }]} />
      </HelmetContext.Provider>,
    );

    await waitFor(() => {
      expect(setHeadSpy).toHaveBeenCalled();
    });

    expect(setHeadSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: "Legacy Context Title",
        meta: [{ name: "description", content: "Legacy" }],
      }),
    );
  });
});
