import "@testing-library/jest-dom";

import React from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { Helmet } from "../src/components/Helmet";
import { HelmetProvider } from "../src/context/HelmetProvider";

const managed = <T extends Element>(selector: string) =>
  Array.from(document.head.querySelectorAll<T>(`${selector}[data-react-helmet-pro="true"]`));

const flushMutations = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("incremental managed tag reconciliation", () => {
  afterEach(async () => {
    cleanup();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    document.head.innerHTML = "";
    HelmetProvider.canUseDOM = true;
  });

  it("reuses unchanged external scripts and styles when a meta tag changes", async () => {
    const Head = ({ description }: { description: string }) => (
      <HelmetProvider>
        <Helmet
          defer={false}
          link={[{ href: "data:text/css,.stable%7Bcolor:green%7D", rel: "stylesheet" }]}
          meta={[{ content: description, name: "description" }]}
          script={[{ src: "data:text/javascript,void%200" }]}
          style={[{ cssText: ".stable { color: green; }", media: "screen" }]}
        />
      </HelmetProvider>
    );

    const { rerender } = render(<Head description="Before" />);
    const script = managed<HTMLScriptElement>("script")[0];
    const stylesheet = managed<HTMLLinkElement>('link[rel="stylesheet"]')[0];
    const style = managed<HTMLStyleElement>("style")[0];

    rerender(<Head description="After" />);

    await waitFor(() => {
      expect(managed<HTMLMetaElement>('meta[name="description"]')[0]).toHaveAttribute(
        "content",
        "After",
      );
    });
    expect(managed<HTMLScriptElement>("script")[0]).toBe(script);
    expect(managed<HTMLLinkElement>('link[rel="stylesheet"]')[0]).toBe(stylesheet);
    expect(managed<HTMLStyleElement>("style")[0]).toBe(style);
  });

  it("uses one bounded attribute mutation for a one-tag value change", async () => {
    const Head = ({ description }: { description: string }) => (
      <HelmetProvider>
        <Helmet
          defer={false}
          meta={[
            { content: description, name: "description" },
            { content: "width=device-width", name: "viewport" },
          ]}
        />
      </HelmetProvider>
    );
    const { rerender } = render(<Head description="Before" />);
    const description = managed<HTMLMetaElement>('meta[name="description"]')[0];
    const viewport = managed<HTMLMetaElement>('meta[name="viewport"]')[0];
    const records: MutationRecord[] = [];
    const observer = new MutationObserver((mutations) => records.push(...mutations));
    observer.observe(document.head, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });

    rerender(<Head description="After" />);
    await flushMutations();
    observer.disconnect();

    expect(managed<HTMLMetaElement>('meta[name="description"]')[0]).toBe(description);
    expect(managed<HTMLMetaElement>('meta[name="viewport"]')[0]).toBe(viewport);
    expect(records).toHaveLength(1);
    expect(records[0].type).toBe("attributes");
    expect(records[0].target).toBe(description);
    expect(records[0].attributeName).toBe("content");
  });

  it("moves keyed nodes into explicit order without recreating them", async () => {
    const tags = {
      a: { content: "A", key: "a", name: "item" },
      b: { content: "B", key: "b", name: "item" },
      c: { content: "C", key: "c", name: "item" },
    };
    const Head = ({ order }: { order: Array<keyof typeof tags> }) => (
      <HelmetProvider>
        <Helmet defer={false} meta={order.map((key) => tags[key])} />
      </HelmetProvider>
    );
    const { rerender } = render(<Head order={["a", "b", "c"]} />);
    const original = new Map(
      managed<HTMLMetaElement>('meta[name="item"]').map((node) => [node.content, node]),
    );

    rerender(<Head order={["c", "a", "b"]} />);

    await waitFor(() => {
      expect(managed<HTMLMetaElement>('meta[name="item"]').map((node) => node.content)).toEqual([
        "C",
        "A",
        "B",
      ]);
    });
    managed<HTMLMetaElement>('meta[name="item"]').forEach((node) => {
      expect(node).toBe(original.get(node.content));
      expect(node).not.toHaveAttribute("key");
    });
  });

  it("adopts compatible server-rendered tags without duplicating or replacing them", async () => {
    HelmetProvider.canUseDOM = false;
    const context: { helmet?: ReturnType<typeof Helmet.peek> } = {};
    renderToString(
      <HelmetProvider context={context}>
        <Helmet
          link={[{ href: "data:text/css,.server%7Bcolor:blue%7D", rel: "stylesheet" }]}
          meta={[{ content: "Server description", name: "description" }]}
          script={[{ src: "data:text/javascript,void%200" }]}
          title="Server title"
        />
      </HelmetProvider>,
    );
    document.head.innerHTML = [
      context.helmet?.link.toString(),
      context.helmet?.meta.toString(),
      context.helmet?.script.toString(),
      context.helmet?.title.toString(),
    ].join("");
    const serverNodes = Array.from(document.head.children);
    const records: MutationRecord[] = [];
    const observer = new MutationObserver((mutations) => records.push(...mutations));
    observer.observe(document.head, { attributes: true, childList: true, subtree: true });

    HelmetProvider.canUseDOM = true;
    render(
      <HelmetProvider>
        <Helmet
          defer={false}
          link={[{ href: "data:text/css,.server%7Bcolor:blue%7D", rel: "stylesheet" }]}
          meta={[{ content: "Server description", name: "description" }]}
          script={[{ src: "data:text/javascript,void%200" }]}
          title="Server title"
        />
      </HelmetProvider>,
    );
    await flushMutations();
    observer.disconnect();

    expect(Array.from(document.head.children)).toEqual(serverNodes);
    expect(records).toHaveLength(0);
    expect(managed("link")).toHaveLength(1);
    expect(managed("meta")).toHaveLength(1);
    expect(managed("script")).toHaveLength(1);
  });

  it("preserves repeatable tags while updating one stable identity", async () => {
    const Head = ({ title }: { title: string }) => (
      <HelmetProvider>
        <Helmet
          defer={false}
          meta={[
            { content: title, property: "og:title" },
            { content: "/one.jpg", property: "og:image" },
            { content: "/two.jpg", property: "og:image" },
          ]}
        />
      </HelmetProvider>
    );
    const { rerender } = render(<Head title="Before" />);
    const images = managed<HTMLMetaElement>('meta[property="og:image"]');

    rerender(<Head title="After" />);

    await waitFor(() => {
      expect(managed<HTMLMetaElement>('meta[property="og:title"]')[0].content).toBe("After");
    });
    expect(managed<HTMLMetaElement>('meta[property="og:image"]')).toEqual(images);
  });
});
