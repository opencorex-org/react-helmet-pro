import React from "react";
import { render, waitFor, cleanup } from "@testing-library/react";
import {
  Analytics,
  createGoogleTagUrl,
  isGoogleTagId,
  type GoogleTagId,
} from "../src/components/Analytics";
import { HelmetProvider } from "../src/context/HelmetProvider";

describe("Analytics", () => {
  beforeEach(() => {
    // jsdom is configured to load script resources; keep unit tests offline.
    vi.spyOn(HTMLScriptElement.prototype, "src", "set").mockImplementation(function (this: HTMLScriptElement, value) {
      this.setAttribute("data-test-src", value);
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.head
      .querySelectorAll("script[data-gtag-id], script[data-gtag-loader]")
      .forEach((script) => script.remove());
  });

  it.each(["G-ABC123", "GT-ABC123", "AW-123456", "DC-ABC123"])(
    "accepts the supported Google tag ID %s",
    (id) => {
      expect(isGoogleTagId(id)).toBe(true);
    },
  );

  it.each([
    "",
    "G-",
    "UA-12345-1",
    "G-abc123",
    "G-ABC'123",
    'G-ABC"123',
    "G-ABC\\123",
    "G-ABC<\/script>",
    "G-測定123",
  ])("rejects invalid and script-breaking ID %j", (id) => {
    expect(isGoogleTagId(id)).toBe(false);
  });

  it("constructs the loader URL deterministically", () => {
    expect(createGoogleTagUrl("G-ABC123")).toBe(
      "https://www.googletagmanager.com/gtag/js?id=G-ABC123",
    );
  });

  it("keeps the validated ID out of executable JavaScript", async () => {
    render(<Analytics type="gtag" id="G-ABC123" />);

    await waitFor(() => {
      expect(document.head.querySelector('script[data-gtag-id="G-ABC123"]')).not.toBeNull();
    });

    const inlineScript =
      document.head.querySelector<HTMLScriptElement>("script[data-gtag-id]");
    expect(inlineScript?.textContent).not.toContain("G-ABC123");
    expect(inlineScript?.textContent).toContain("document.currentScript.dataset.gtagId");
  });

  it("does not create scripts for an invalid runtime value", () => {
    render(<Analytics type="gtag" id={'G-OK\');alert(1);//' as GoogleTagId} />);

    expect(document.head.querySelector("script[data-gtag-id]")).toBeNull();
    expect(document.head.querySelector("script[data-gtag-loader]")).toBeNull();
  });

  it("applies a CSP nonce to both scripts", async () => {
    render(<Analytics type="gtag" id="G-ABC123" nonce="nonce-value" />);

    await waitFor(() => {
      expect(document.head.querySelectorAll("script[nonce='nonce-value']")).toHaveLength(2);
    });
  });

  it("removes scripts on unmount", async () => {
    const { unmount } = render(<Analytics type="gtag" id="G-ABC123" />);

    await waitFor(() => {
      expect(document.head.querySelector('script[data-gtag-id="G-ABC123"]')).not.toBeNull();
    });

    unmount();

    await waitFor(() => {
      expect(document.head.querySelector('script[data-gtag-id="G-ABC123"]')).toBeNull();
    });
  });

  it("prevents duplicate scripts in React Strict Mode", async () => {
    render(
      <React.StrictMode>
        <Analytics type="gtag" id="G-ABC123" />
      </React.StrictMode>
    );

    await waitFor(() => {
      expect(document.head.querySelectorAll('script[data-gtag-id="G-ABC123"]')).toHaveLength(1);
      expect(document.head.querySelectorAll('script[data-gtag-loader="G-ABC123"]')).toHaveLength(1);
    });
  });

  it("removes old scripts and appends new ones when the ID updates", async () => {
    const { rerender } = render(
      <HelmetProvider><Analytics type="gtag" id="G-ABC123" /></HelmetProvider>
    );

    await waitFor(() => {
      expect(document.head.querySelector('script[data-gtag-id="G-ABC123"]')).not.toBeNull();
    });

    rerender(
      <HelmetProvider><Analytics type="gtag" id="G-XYZ789" /></HelmetProvider>
    );

    await waitFor(() => {
      expect(document.head.querySelector('script[data-gtag-id="G-ABC123"]')).toBeNull();
      expect(document.head.querySelector('script[data-gtag-id="G-XYZ789"]')).not.toBeNull();
    });
  });

  it("deduplicates identical Analytics instances and cleans up when all are unmounted", async () => {
    // Render two instances with the same ID in the same provider tree — Helmet deduplicates them
    const { unmount: unmountA } = render(
      <HelmetProvider>
        <Analytics type="gtag" id="G-ABC123" />
        <Analytics type="gtag" id="G-ABC123" />
      </HelmetProvider>
    );

    await waitFor(() => {
      // Helmet deduplication keeps exactly one script for the same ID
      expect(document.head.querySelectorAll('script[data-gtag-id="G-ABC123"]')).toHaveLength(1);
    });

    unmountA();

    // After full unmount, all managed scripts should be removed
    await waitFor(() => {
      expect(document.head.querySelector('script[data-gtag-id="G-ABC123"]')).toBeNull();
    });
  });

  it("preserves existing third-party scripts on unmount", async () => {
    // Inject third-party script manually without Helmet's data-react-helmet-pro marker
    const thirdParty = document.createElement("script");
    thirdParty.dataset.gtagId = "G-ABC123";
    thirdParty.textContent = "/* third-party config */";
    document.head.appendChild(thirdParty);

    const { unmount } = render(<Analytics type="gtag" id="G-ABC123" />);

    // Expect both: the third-party script and the Helmet-managed inline script
    await waitFor(() => {
      expect(document.head.querySelectorAll('script[data-gtag-id="G-ABC123"]')).toHaveLength(2);
    });

    unmount();

    // After unmount, only the manually-injected third-party script should remain
    await waitFor(() => {
      expect(document.head.querySelectorAll('script[data-gtag-id="G-ABC123"]')).toHaveLength(1);
      const remainingScript = document.head.querySelector('script[data-gtag-id="G-ABC123"]');
      expect(remainingScript?.textContent).toContain("third-party");
    });

    // Cleanup manual script
    thirdParty.remove();
  });
});
