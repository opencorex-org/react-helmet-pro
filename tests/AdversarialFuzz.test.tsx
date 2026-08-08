import React, { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Helmet } from "../src/components/Helmet";
import { HelmetProvider } from "../src/context/HelmetProvider";
import { HelmetData } from "../src/core/HelmetData";
import { HelmetDispatcher } from "../src/core/HelmetDispatcher";
import { parseHtmlToHelmetState } from "../src/cli/htmlParser";

// ─── 1. Seedable LCG Pseudo-Random Number Generator (PRNG) ─────────────────
class LcgPrng {
  private state: number;
  constructor(seed: number) {
    this.state = seed;
  }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
  randomString(length: number, characters: string): string {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += this.pick(characters.split(""));
    }
    return result;
  }
}

// Local implementation of stableStringify to avoid dependency resolution errors
const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const objectValue = value as Record<string, any>;
  const keys = Object.keys(objectValue).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`).join(",")}}`;
};

// Adversarial and safe characters for generation
const ADVERSARIAL_VALUES = [
  '</script><script>alert("xss")</script>',
  'javascript:alert("xss")',
  '\'" breakout="attr" onclick="alert(1)"',
  'normal-string-value',
  'unicode-⚡-emoji-💥',
  'RTL-عربى-unicode',
  '\u0000null-byte-termination', // Null-byte termination
  '&quot;&amp;&lt;&gt;', // HTML Entities
  '  spaces  and\nnewlines\rand\ttabs  ',
  '', // Empty string
];

describe("Adversarial Fuzz & Property Testing Suite", () => {
  let seed: number;
  let prng: LcgPrng;

  beforeEach(() => {
    // Clear JSDOM title tag to force Helmet creation of data-react-helmet-pro title tags
    document.head.querySelectorAll("title").forEach((node) => node.parentNode?.removeChild(node));
    // Clear any leftover managed tags from previous runs
    document.head.querySelectorAll("*[data-react-helmet-pro]").forEach((node) => node.parentNode?.removeChild(node));
    
    // Select seed: override with environment variable if present, validating it's a number
    const envSeed = process.env.FUZZ_SEED ? parseInt(process.env.FUZZ_SEED, 10) : NaN;
    seed = isNaN(envSeed) ? Math.floor(Math.random() * 1000000) : envSeed;
    
    prng = new LcgPrng(seed);
    HelmetProvider.canUseDOM = true;
  });

  afterEach(() => {
    cleanup();
  });

  const runWithSeedGuard = async (testFn: () => void | Promise<void>) => {
    try {
      await testFn();
    } catch (err: any) {
      err.message = `[FUZZ FAILURE] Failed with seed: ${seed}. Original error: ${err.message}`;
      throw err;
    }
  };

  // Helper to generate a random tag object with unique dedupe keys to avoid collisions
  const generateRandomTag = (type: string, uniqueId: number): any => {
    const val = prng.pick(ADVERSARIAL_VALUES);
    switch (type) {
      case "title":
        return { text: val, attributes: { class: prng.pick(ADVERSARIAL_VALUES) } };
      case "meta":
        return { name: `meta-name-${uniqueId}`, content: val };
      case "link":
        return { rel: `link-rel-${uniqueId}`, href: `https://example.com/href/${uniqueId}?val=${encodeURIComponent(val)}`, hreflang: prng.pick(ADVERSARIAL_VALUES) };
      case "script":
        return { type: "application/ld+json", innerHTML: prng.pick(ADVERSARIAL_VALUES) };
      case "style":
        return { media: `media-${uniqueId}`, cssText: val };
      case "noscript":
        return { innerHTML: val };
      default:
        return {};
    }
  };

  describe("Deterministic State Reduction & Stable SSR Serialization", () => {
    it("ensures that shuffling equivalent inputs produces byte-stable serialized state outputs", async () => {
      await runWithSeedGuard(() => {
        // Generate random tags with unique keys
        const metaTags = Array.from({ length: 15 }, (_, idx) => generateRandomTag("meta", idx));
        const linkTags = Array.from({ length: 15 }, (_, idx) => generateRandomTag("link", idx));

        const buildState = (metas: any[], links: any[], insertionOrder: number[]) => {
          const dispatcher = new HelmetDispatcher();
          const instances = [
            {
              id: "inst-1",
              order: 1,
              data: {
                meta: metas.slice(0, 5), link: links.slice(0, 5), base: [], script: [], style: [], noscript: [],
                htmlAttributes: {}, bodyAttributes: {}, titleAttributes: {}
              }
            },
            {
              id: "inst-2",
              order: 2,
              data: {
                meta: metas.slice(5, 10), link: links.slice(5, 10), base: [], script: [], style: [], noscript: [],
                htmlAttributes: {}, bodyAttributes: {}, titleAttributes: {}
              }
            },
            {
              id: "inst-3",
              order: 3,
              data: {
                meta: metas.slice(10, 15), link: links.slice(10, 15), base: [], script: [], style: [], noscript: [],
                htmlAttributes: {}, bodyAttributes: {}, titleAttributes: {}
              }
            }
          ];

          // Upsert according to the specified insertion order
          insertionOrder.forEach((idx) => {
            const inst = instances[idx];
            dispatcher.upsert(inst.id, inst.data, inst.order);
          });

          return dispatcher.getState();
        };

        const stateNormal = buildState(metaTags, linkTags, [0, 1, 2]);
        const stateShuffled = buildState(metaTags, linkTags, [2, 0, 1]);

        // Assert that the serialized JSON format is identical under any instance registration order permutation
        expect(stableStringify(stateNormal)).toBe(stableStringify(stateShuffled));
      });
    });
  });

  describe("SSR to DOM Hydration Round-Trip", () => {
    it("verifies parsed SSR output creates equivalent client state upon hydration without duplicates", async () => {
      await runWithSeedGuard(() => {
        // Run SSR to generate output
        HelmetProvider.canUseDOM = false;
        const helmetData = new HelmetData({});
        
        const randomMeta = Array.from({ length: 5 }, (_, idx) => generateRandomTag("meta", idx));
        const randomLink = Array.from({ length: 5 }, (_, idx) => generateRandomTag("link", idx));

        renderToString(
          <HelmetProvider context={helmetData.context}>
            <Helmet>
              <title>Fuzz Hydration Title</title>
              {randomMeta.map((m, idx) => <meta key={idx} name={m.name} content={m.content} />)}
              {randomLink.map((l, idx) => <link key={idx} rel={l.rel} href={l.href} />)}
            </Helmet>
          </HelmetProvider>
        );

        const ssrOutput = buildSsrHtmlString(helmetData.context.helmet);

        // Parse SSR string using the CLI parser
        const parsedState = parseHtmlToHelmetState(ssrOutput);

        // Verify that the parsed state contains correct tags
        expect(parsedState.title).toBe("Fuzz Hydration Title");
        expect(parsedState.meta.length).toBe(randomMeta.length);
        expect(parsedState.link.length).toBe(randomLink.length);

        // Simulate client-side hydration: should result in identical state and no duplicates
        HelmetProvider.canUseDOM = true;
        const hostElement = document.createElement("div");
        document.body.appendChild(hostElement);

        act(() => {
          render(
            <HelmetProvider>
              <Helmet defer={false}>
                <title>Fuzz Hydration Title</title>
                {randomMeta.map((m, idx) => <meta key={idx} name={m.name} content={m.content} />)}
                {randomLink.map((l, idx) => <link key={idx} rel={l.rel} href={l.href} />)}
              </Helmet>
            </HelmetProvider>,
            { container: hostElement }
          );
        });

        // Verify head title matches, and meta/link contain no duplicates
        const titleNode = document.head.querySelector("title[data-react-helmet-pro]");
        const metaNodes = document.head.querySelectorAll("meta[data-react-helmet-pro]");
        const linkNodes = document.head.querySelectorAll("link[data-react-helmet-pro]");

        expect(titleNode?.textContent).toBe("Fuzz Hydration Title");
        expect(metaNodes.length).toBe(randomMeta.length);
        expect(linkNodes.length).toBe(randomLink.length);

        // Cleanup DOM changes
        act(() => {
          document.head.querySelectorAll("*[data-react-helmet-pro]").forEach((node) => node.parentNode?.removeChild(node));
          document.body.removeChild(hostElement);
        });
      });
    });
  });

  describe("Lifecycle Mount, Update, and Unmount Fuzzing", () => {
    it("ensures lifecycle sequences leave no nodes after final unmount", async () => {
      await runWithSeedGuard(async () => {
        let tagCounter = 0;
        const activeHelmets: Array<{ id: number; show: boolean; metas: any[] }> = Array.from(
          { length: 10 },
          (_, idx) => ({
            id: idx,
            show: true,
            metas: Array.from({ length: prng.nextInt(1, 3) }, () => generateRandomTag("meta", tagCounter++)),
          })
        );

        const FuzzComponent = () => {
          const [helmets, setHelmets] = useState(activeHelmets);
          (globalThis as any).setFuzzHelmets = setHelmets;

          return (
            <HelmetProvider>
              {helmets.map((h) =>
                h.show ? (
                  <Helmet key={h.id} defer={false}>
                    {h.metas.map((m, idx) => (
                      <meta key={idx} name={m.name} content={m.content} />
                    ))}
                  </Helmet>
                ) : null
              )}
            </HelmetProvider>
          );
        };

        let unmount: () => void = () => {};
        act(() => {
          const renderResult = render(<FuzzComponent />);
          unmount = renderResult.unmount;
        });

        // Run 20 random lifecycle updates (hide, show, mutate)
        for (let step = 0; step < 20; step++) {
          const action = prng.pick(["hide", "show", "mutate"]);
          const idx = prng.nextInt(0, activeHelmets.length - 1);
          
          act(() => {
            if (action === "hide") {
              activeHelmets[idx].show = false;
            } else if (action === "show") {
              activeHelmets[idx].show = true;
            } else {
              activeHelmets[idx].metas = Array.from({ length: prng.nextInt(1, 3) }, () => generateRandomTag("meta", tagCounter++));
            }

            // Trigger state update
            (globalThis as any).setFuzzHelmets([...activeHelmets]);
          });
        }

        // Unmount everything
        act(() => {
          unmount();
        });

        // Flush scheduled animation frames since empty state has defer=true by default
        await new Promise((resolve) => requestAnimationFrame(resolve));

        // Verify that absolutely no managed nodes (except title which is preserved with empty content) are left in the document head
        const leftoverNodes = Array.from(document.head.querySelectorAll("*[data-react-helmet-pro]"))
          .filter((node) => node.tagName.toLowerCase() !== "title");
        expect(leftoverNodes.length).toBe(0);

        delete (globalThis as any).setFuzzHelmets;
      });
    });
  });

  describe("Adversarial Security & Context breakouts", () => {
    it("escapes all security-relevant breakout sequences cleanly", async () => {
      await runWithSeedGuard(() => {
        HelmetProvider.canUseDOM = false;
        const helmetData = new HelmetData({});

        renderToString(
          <HelmetProvider context={helmetData.context}>
            <Helmet>
              <title>{'</title><script>alert("xss")</script>'}</title>
              <meta name="description" content={'description" content="breakout" style="color:red"'} />
              <script type="application/ld+json">
                {JSON.stringify({ name: '</script><script>alert(1)</script>' })}
              </script>
            </Helmet>
          </HelmetProvider>
        );

        const ssrOutput = buildSsrHtmlString(helmetData.context.helmet);

        // Verify HTML tags do not contain unescaped breakout tags
        expect(ssrOutput).not.toContain('</title><script>alert("xss")</script>');
        expect(ssrOutput).not.toContain('description" content="breakout"');
        expect(ssrOutput).not.toContain('</script><script>alert(1)</script>');
      });
    });
  });

  describe("Concurrent SSR Request-Isolation Fuzzing", () => {
    it("ensures that high-concurrency async renders do not bleed states across requests", async () => {
      await runWithSeedGuard(async () => {
        // Run 50 staggered asynchronous renders in parallel
        const runRequest = async (id: number, delay: number) => {
          const helmetData = new HelmetData({});
          
          // Step 1: async wait before starting to interleave execution timelines
          await new Promise((resolve) => setTimeout(resolve, delay));

          HelmetProvider.canUseDOM = false;
          renderToString(
            <HelmetProvider context={helmetData.context}>
              <Helmet>
                <title>{`Title Request ${id}`}</title>
                <meta name="request-id" content={String(id)} />
              </Helmet>
            </HelmetProvider>
          );

          // Step 2: async wait after render to simulate interleaved state reads
          await new Promise((resolve) => setTimeout(resolve, prng.nextInt(1, 10)));

          return { id, title: helmetData.context.helmet?.title.toString(), meta: helmetData.context.helmet?.meta.toString() };
        };

        const promises = Array.from({ length: 50 }, (_, idx) =>
          runRequest(idx, prng.nextInt(1, 20))
        );

        const results = await Promise.all(promises);

        // Verify that every request has strictly isolated, correct inputs
        results.forEach((res) => {
          expect(res.title).toContain(`Title Request ${res.id}`);
          expect(res.meta).toContain(`content="${res.id}"`);
        });
      });
    });
  });
});

// Helper to construct a single string from server state for test parsing
function buildSsrHtmlString(helmet: any): string {
  if (!helmet) return "";
  return `
    ${helmet.title.toString()}
    ${helmet.meta.toString()}
    ${helmet.link.toString()}
    ${helmet.script.toString()}
    ${helmet.style.toString()}
    ${helmet.noscript.toString()}
  `;
}
