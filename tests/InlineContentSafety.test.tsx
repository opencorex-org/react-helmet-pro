import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import {
  createJsonLdContent,
  createNoscriptHtml,
  createScriptContent,
  createStyleContent,
  safeJsonLdStringify,
} from "../src/core/inlineContent";
import { updateTag } from "../src/core/HelmetManager";
import { buildServerState, createEmptyState } from "../src/core/helmetState";

afterEach(() => {
  document.head.innerHTML = "";
});

describe("inline content safety contract", () => {
  it("keeps JSON-LD valid while escaping HTML breakers, entities, and Unicode separators", () => {
    const value = {
      html: "</script><script>&payload</script>",
      separators: "line\u2028paragraph\u2029",
    };
    const serialized = safeJsonLdStringify(value);

    expect(serialized).not.toContain("</script");
    expect(serialized).not.toContain("&payload");
    expect(serialized).not.toContain("\u2028");
    expect(serialized).not.toContain("\u2029");
    expect(JSON.parse(serialized)).toEqual(value);
  });

  it("produces equivalent server strings and React components for every inline context", () => {
    const state = {
      ...createEmptyState(),
      script: [
        {
          scriptContent: createScriptContent('window.message = "</ScRiPt><!--&";'),
        },
        {
          type: "application/ld+json",
          jsonLd: createJsonLdContent({ name: "</script>", entity: "&copy;" }),
        },
      ],
      style: [
        {
          styleContent: createStyleContent('a::after { content: "</STYLE><!--&"; }'),
        },
      ],
      noscript: [
        {
          htmlContent: createNoscriptHtml("<p>&amp; fallback</p></NOSCRIPT><script>bad()</script>"),
        },
      ],
    };
    const server = buildServerState(state);

    for (const accessor of [server.script, server.style, server.noscript]) {
      expect(renderToStaticMarkup(<>{accessor.toComponent()}</>)).toBe(accessor.toString());
    }

    const output = server.script.toString() + server.style.toString() + server.noscript.toString();
    expect(output).not.toContain("</ScRiPt");
    expect(output).not.toContain("</STYLE");
    expect(output).not.toContain("</NOSCRIPT");
    expect(output).toContain("<\\/script");
    expect(output).toContain("<\\/style");
    expect(output).toContain("&lt;/noscript");
  });

  it("uses the same normalized content during client DOM updates", () => {
    const script = updateTag("script", {
      scriptContent: createScriptContent('window.message = "</script><!--&";'),
    });
    const style = updateTag("style", {
      styleContent: createStyleContent('a::after { content: "</style>&"; }'),
    });
    const noscript = updateTag("noscript", {
      htmlContent: createNoscriptHtml("<p>fallback</p></noscript><script>bad()</script>"),
    });

    expect(script.textContent).toContain("<\\/script");
    expect(style.textContent).toContain("<\\/style");
    expect(noscript.innerHTML).toContain("&lt;/noscript>");
    expect(script.hasAttribute("script-content")).toBe(false);
    expect(style.hasAttribute("style-content")).toBe(false);
    expect(noscript.hasAttribute("html-content")).toBe(false);
  });

  it("protects legacy fields and ignores the unsafe global encoding opt-out", () => {
    const state = {
      ...createEmptyState(),
      encodeSpecialCharacters: false,
      meta: [{ name: "description", content: '\"><script>bad()</script>' }],
      script: [{ type: "application/ld+json", innerHTML: '{"name":"</script>"}' }],
      style: [{ cssText: 'a{content:"</style>"}' }],
      noscript: [{ innerHTML: "</noscript><script>bad()</script>" }],
      title: "</title><script>bad()</script>",
    };
    const server = buildServerState(state);

    expect(server.meta.toString()).toContain("&quot;&gt;&lt;script&gt;");
    expect(server.title.toString()).toContain("&lt;/title&gt;");
    expect(server.script.toString()).toContain("\\u003c/script>");
    expect(server.style.toString()).toContain("<\\/style>");
    expect(server.noscript.toString()).toContain("&lt;/noscript>");
  });
});
