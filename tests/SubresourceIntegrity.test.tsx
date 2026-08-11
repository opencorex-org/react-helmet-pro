import "@testing-library/jest-dom";

import React from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ExternalScript,
  ExternalStylesheet,
  HelmetData,
  HelmetProvider,
  auditHelmetState,
  buildExternalScript,
  buildExternalStylesheet,
  isValidIntegrity,
  validateIntegrity,
} from "../src";
import { parseHtmlToHelmetState } from "../src/cli/htmlParser";
import type { HelmetServerContext, SubresourceIntegrity } from "../src/types";

const SHA256 = `sha256-${"A".repeat(43)}=` as SubresourceIntegrity;
const SHA384 = `sha384-${"A".repeat(64)}` as SubresourceIntegrity;
const SHA512 = `sha512-${"A".repeat(86)}==` as SubresourceIntegrity;

describe("Subresource Integrity helpers", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.head.innerHTML = "";
    HelmetProvider.canUseDOM = true;
  });

  it("validates sha256, sha384, sha512, and multi-hash metadata", () => {
    expect(isValidIntegrity(SHA256)).toBe(true);
    expect(isValidIntegrity(SHA384)).toBe(true);
    expect(isValidIntegrity(SHA512)).toBe(true);

    const multiple = validateIntegrity(`${SHA256} ${SHA384} ${SHA512}`);
    expect(multiple).toEqual({
      algorithms: ["sha256", "sha384", "sha512"],
      valid: true,
    });
  });

  it.each([
    "",
    "md5-AAAA",
    "sha256-not*base64",
    "sha256-AAAA",
    "sha384-AAAA sha512-not*base64",
  ])("rejects invalid integrity metadata %j", (integrity) => {
    expect(validateIntegrity(integrity).valid).toBe(false);
  });

  it("applies browser-safe CORS and referrer policy defaults", () => {
    expect(buildExternalScript({ integrity: SHA384, src: "https://cdn.example.com/app.js" })).toEqual({
      crossOrigin: "anonymous",
      integrity: SHA384,
      referrerPolicy: "no-referrer",
      src: "https://cdn.example.com/app.js",
    });
    expect(
      buildExternalStylesheet({ href: "https://cdn.example.com/app.css", integrity: SHA384 }),
    ).toEqual({
      crossOrigin: "anonymous",
      href: "https://cdn.example.com/app.css",
      integrity: SHA384,
      referrerPolicy: "no-referrer",
      rel: "stylesheet",
    });
  });

  it("renders reflected browser CORS attributes and supports credential overrides", async () => {
    render(
      <HelmetProvider>
        <ExternalScript integrity={SHA384} src="data:text/javascript,void%200" />
        <ExternalStylesheet
          crossOrigin="use-credentials"
          href="data:text/css,body%7Bcolor:black%7D"
          integrity={SHA512}
          referrerPolicy="strict-origin"
        />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(document.head.querySelector("script[data-react-helmet-pro]")).not.toBeNull();
      expect(document.head.querySelector("link[data-react-helmet-pro]")).not.toBeNull();
    });

    const script = document.head.querySelector<HTMLScriptElement>("script[data-react-helmet-pro]")!;
    const stylesheet = document.head.querySelector<HTMLLinkElement>("link[data-react-helmet-pro]")!;
    expect(script.crossOrigin).toBe("anonymous");
    expect(script).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(stylesheet.crossOrigin).toBe("use-credentials");
    expect(stylesheet).toHaveAttribute("referrerpolicy", "strict-origin");
  });

  it("preserves integrity, CORS, and referrer policy across SSR and client hydration", async () => {
    HelmetProvider.canUseDOM = false;
    const context: HelmetServerContext = {};
    renderToString(
      <HelmetProvider context={context}>
        <ExternalScript integrity={SHA256} src="data:text/javascript,void%200" />
        <ExternalStylesheet href="data:text/css,body%7Bcolor:black%7D" integrity={SHA384} />
      </HelmetProvider>,
    );

    const serverMarkup = `${context.helmet?.link.toString()}${context.helmet?.script.toString()}`;
    document.head.innerHTML = serverMarkup;
    const serverScript = document.head.querySelector<HTMLScriptElement>("script")!;
    const serverStylesheet = document.head.querySelector<HTMLLinkElement>("link")!;
    expect(serverScript.getAttribute("integrity")).toBe(SHA256);
    expect(serverScript.getAttribute("crossorigin")).toBe("anonymous");
    expect(serverScript.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(serverStylesheet.getAttribute("integrity")).toBe(SHA384);

    HelmetProvider.canUseDOM = true;
    render(
      <HelmetProvider>
        <ExternalScript integrity={SHA256} src="data:text/javascript,void%200" />
        <ExternalStylesheet href="data:text/css,body%7Bcolor:black%7D" integrity={SHA384} />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(document.head.querySelector("script[data-react-helmet-pro]")).not.toBeNull();
    });
    const hydratedScript = document.head.querySelector<HTMLScriptElement>(
      "script[data-react-helmet-pro]",
    )!;
    const hydratedStylesheet = document.head.querySelector<HTMLLinkElement>(
      "link[data-react-helmet-pro]",
    )!;
    expect(hydratedScript.getAttribute("integrity")).toBe(serverScript.getAttribute("integrity"));
    expect(hydratedScript.getAttribute("crossorigin")).toBe(serverScript.getAttribute("crossorigin"));
    expect(hydratedScript.getAttribute("referrerpolicy")).toBe(
      serverScript.getAttribute("referrerpolicy"),
    );
    expect(hydratedStylesheet.getAttribute("integrity")).toBe(
      serverStylesheet.getAttribute("integrity"),
    );
  });

  it("reports invalid syntax and unusable cross-origin combinations in development", () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    HelmetProvider.canUseDOM = false;
    const helmetData = new HelmetData({});
    helmetData.dispatcher.setHead({
      script: [
        {
          integrity: "sha256-invalid" as SubresourceIntegrity,
          src: "https://cdn.example.com/app.js",
        },
      ],
    });

    const result = auditHelmetState(helmetData.getState(), {
      enableDevDiagnostics: true,
    });

    expect(result.diagnostics.map((diagnostic) => diagnostic.id)).toEqual(
      expect.arrayContaining([
        "RHP_SECURITY_INVALID_SRI",
        "RHP_SECURITY_SRI_CORS_REQUIRED",
      ]),
    );
    expect(consoleWarn).toHaveBeenCalled();
  });

  it("parses SRI attributes from static HTML without casing drift", () => {
    const state = parseHtmlToHelmetState(
      `<link rel="stylesheet" href="https://cdn.example.com/app.css" integrity="${SHA384}" crossorigin="anonymous" referrerpolicy="no-referrer" />` +
        `<script src="https://cdn.example.com/app.js" integrity="${SHA512}" crossorigin="use-credentials" referrerpolicy="strict-origin"></script>`,
    );

    expect(state.link[0]).toEqual(
      expect.objectContaining({
        crossOrigin: "anonymous",
        integrity: SHA384,
        referrerPolicy: "no-referrer",
      }),
    );
    expect(state.script[0]).toEqual(
      expect.objectContaining({
        crossOrigin: "use-credentials",
        integrity: SHA512,
        referrerPolicy: "strict-origin",
      }),
    );
  });
});
