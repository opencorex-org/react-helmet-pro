import { render, waitFor } from "@testing-library/react";
import {
  Analytics,
  createGoogleTagUrl,
  isGoogleTagId,
  type GoogleTagId,
} from "../src/components/Analytics";

describe("Analytics", () => {
  beforeEach(() => {
    // jsdom is configured to load script resources; keep unit tests offline.
    vi.spyOn(HTMLScriptElement.prototype, "src", "set").mockImplementation(function (value) {
      this.setAttribute("data-test-src", value);
    });
  });

  afterEach(() => {
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
});
