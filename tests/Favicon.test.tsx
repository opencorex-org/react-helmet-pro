import React, { StrictMode, useState } from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Favicon } from "../src/components/Favicon";
import { HelmetProvider } from "../src/context/HelmetProvider";

const getIcons = () =>
  Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"]'));

describe("Favicon", () => {
  afterEach(() => {
    cleanup();
    document.head.innerHTML = "";
  });

  it("preserves application-owned icons and restores the pre-mount state", async () => {
    const applicationIcon = document.createElement("link");
    applicationIcon.rel = "icon";
    applicationIcon.href = "/application.ico";
    document.head.appendChild(applicationIcon);

    const { unmount } = render(
      <HelmetProvider>
        <Favicon href="/managed.ico" />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(getIcons()).toHaveLength(2);
    });
    expect(getIcons()[0]).toBe(applicationIcon);
    expect(applicationIcon).not.toHaveAttribute("data-react-helmet-pro");
    expect(getIcons()[1]).toHaveAttribute("data-react-helmet-pro", "true");

    unmount();

    await waitFor(() => {
      expect(getIcons()).toEqual([applicationIcon]);
    });
  });

  it("supports multiple icon variants in deterministic instance order", async () => {
    render(
      <HelmetProvider>
        <Favicon href="/small.png" type="image/png" sizes="16x16" />
        <Favicon href="/large.png" type="image/png" sizes="32x32" />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(getIcons().map((icon) => icon.getAttribute("href"))).toEqual([
        "/small.png",
        "/large.png",
      ]);
    });
    expect(getIcons().map((icon) => icon.getAttribute("sizes"))).toEqual(["16x16", "32x32"]);
  });

  it("restores the preceding favicon when a route override unmounts", async () => {
    const RouteTransition = () => {
      const [onDetailsRoute, setOnDetailsRoute] = useState(true);

      return (
        <HelmetProvider>
          <Favicon href="/application-route.ico" />
          {onDetailsRoute && <Favicon href="/details-route.ico" />}
          <button type="button" onClick={() => setOnDetailsRoute(false)}>
            Back
          </button>
        </HelmetProvider>
      );
    };

    const { getByRole } = render(<RouteTransition />);

    await waitFor(() => {
      expect(getIcons().map((icon) => icon.getAttribute("href"))).toEqual([
        "/application-route.ico",
        "/details-route.ico",
      ]);
    });

    fireEvent.click(getByRole("button", { name: "Back" }));

    await waitFor(() => {
      expect(getIcons().map((icon) => icon.getAttribute("href"))).toEqual([
        "/application-route.ico",
      ]);
    });
  });

  it("is idempotent in Strict Mode", async () => {
    render(
      <StrictMode>
        <HelmetProvider>
          <Favicon href="/strict.ico" />
        </HelmetProvider>
      </StrictMode>,
    );

    await waitFor(() => {
      expect(getIcons()).toHaveLength(1);
    });
  });

  it("does not throw if its managed node was already detached", async () => {
    const applicationIcon = document.createElement("link");
    applicationIcon.rel = "icon";
    applicationIcon.href = "/application.ico";
    document.head.appendChild(applicationIcon);

    const { unmount } = render(
      <HelmetProvider>
        <Favicon href="/managed.ico" />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(
        document.head.querySelector('link[data-react-helmet-pro="true"][rel="icon"]'),
      ).not.toBeNull();
    });
    const managedIcon = document.head.querySelector<HTMLLinkElement>(
      'link[data-react-helmet-pro="true"][rel="icon"]',
    );
    managedIcon?.remove();

    expect(() => unmount()).not.toThrow();
    expect(getIcons()).toEqual([applicationIcon]);
  });
});
