import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Helmet } from "../src/components/Helmet";
import { HelmetProvider } from "../src/context/HelmetProvider";
import { HelmetData } from "../src/core/HelmetData";
import { HelmetDispatcher } from "../src/core/HelmetDispatcher";

describe("Reliability & Failure Isolation Suite", () => {
  beforeEach(() => {
    HelmetProvider.canUseDOM = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Subscriber Failure Isolation", () => {
    it("ensures a throwing subscriber does not block other subscribers", () => {
      const dispatcher = new HelmetDispatcher({ manageDom: true });
      const onError = vi.fn();
      (dispatcher as any).options.onError = onError;

      let subscriber2Called = false;

      dispatcher.subscribe(() => {
        throw new Error("Subscriber 1 failed");
      });
      dispatcher.subscribe(() => {
        subscriber2Called = true;
      });

      // Trigger a transition
      dispatcher.setHead({ title: "New Title" });

      expect(subscriber2Called).toBe(true);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0].message).toBe("Subscriber 1 failed");
      expect(onError.mock.calls[0][1].phase).toBe("listener");
    });
  });

  describe("DOM Commit & Lifecycle Callback Failure Isolation", () => {
    it("guarantees frame bookkeeping always resets even on sync failure", async () => {
      const dispatcher = new HelmetDispatcher({ manageDom: true });
      const onError = vi.fn();
      (dispatcher as any).options.onError = onError;

      // Set head first to establish initial state
      dispatcher.setHead({
        title: "Initial",
        defer: false,
      });

      // Directly contaminate currentState to bypass sanitization
      (dispatcher as any).currentState.titleAttributes = null;
      (dispatcher as any).currentState.defer = false;

      // Force DOM commit execution
      (dispatcher as any).scheduleDomCommit();

      // Verify bookkeeping resets
      expect((dispatcher as any).frameId).toBeNull();
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][1].phase).toBe("commit");
    });

    it("ensures a throwing lifecycle callback does not block sibling callbacks", () => {
      const helmetData = new HelmetData({});
      const onError = vi.fn();

      const callbackACalled = vi.fn().mockImplementation(() => {
        throw new Error("Callback A failed");
      });
      const callbackBCalled = vi.fn();

      render(
        <HelmetProvider context={helmetData.context} onError={onError}>
          <Helmet defer={false} onChangeClientState={callbackACalled}>
            <title>Title A</title>
          </Helmet>
          <Helmet defer={false} onChangeClientState={callbackBCalled}>
            <meta name="description" content="Description B" />
          </Helmet>
        </HelmetProvider>
      );

      expect(callbackACalled).toHaveBeenCalled();
      expect(callbackBCalled).toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0].message).toBe("Callback A failed");
      expect(onError.mock.calls[0][1].phase).toBe("callback");
    });

    it("handles errors gracefully inside deferred requestAnimationFrame paths", async () => {
      const dispatcher = new HelmetDispatcher({ manageDom: true });
      const onError = vi.fn();
      (dispatcher as any).options.onError = onError;

      // Setup window requestAnimationFrame mock
      const originalRaf = window.requestAnimationFrame;
      const originalCaf = window.cancelAnimationFrame;
      
      let rafCallback: FrameRequestCallback | null = null;
      window.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
        rafCallback = cb;
        return 123;
      });
      window.cancelAnimationFrame = vi.fn();

      const callback = vi.fn().mockImplementation(() => {
        throw new Error("Deferred callback failed");
      });

      // Set head with defer=true (default) and a throwing callback
      dispatcher.upsert("test-id", {
        base: [], link: [], meta: [], noscript: [], script: [], style: [],
        htmlAttributes: {}, bodyAttributes: {}, titleAttributes: {},
        defer: true,
        encodeSpecialCharacters: true,
        prioritizeSeoTags: false,
        onChangeClientState: callback
      }, 0);

      expect((dispatcher as any).frameId).toBe(123);
      expect(rafCallback).toBeDefined();

      // Trigger the animation frame callback manually
      if (rafCallback) {
        (rafCallback as any)();
      }

      // Check bookkeeping reset and error handler capture
      expect((dispatcher as any).frameId).toBeNull();
      expect(callback).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0].message).toBe("Deferred callback failed");
      expect(onError.mock.calls[0][1].phase).toBe("callback");

      // Restore raf/caf
      window.requestAnimationFrame = originalRaf;
      window.cancelAnimationFrame = originalCaf;
    });
  });
});
